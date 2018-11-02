/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Data');

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const schedule = require('node-schedule');
const { JOB } = require('../classes');
const tasks = require('../utils/tasks');
const vrpSql = require('../../vrp-sql');
const vrpUtils = require('../../vrp-common/utils');
const vrpEnum = require('../../enum');
const vrpConfig = require('../../configuration');
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.PLAN;
const TIMEZONE = vrpConfig.get('timezone');
exports.version = 'v2.1';

const cronJob = new schedule.Job(() => tasks.updateExpectedToBeLate()); // used to call only if plan was approved

exports.m_approve = async (req, res, next) => {
    log.debug('m_approveDeliveryPlan', req.user.username);

    const attachedSolution = _.get(req.body, 'solution', null);

    try {
        const solution = vrpUtils.unserialize(attachedSolution);

        const orderIds = await checkPermission(solution);
        await validation(solution, orderIds);

        const affectedVehicles = await getAffectedVehicles(orderIds);
        const unsuccessfulJobs = await getUnsuccessfulJobs(orderIds, affectedVehicles);

        await getHighestRouteNums(solution, affectedVehicles, unsuccessfulJobs);

        const affectedDates = await parseSolutionAndUpdateDatabase(solution, affectedVehicles, unsuccessfulJobs);
        req.status = 204;
        req.answer = undefined;
        next();

        vrpUtils.silenceError(sendWebsocket)(affectedDates, affectedVehicles);
    } catch (err) {
        next(`Solution cannot be approved. ${vrpUtils.parseError(err)}`);
    }

    async function checkPermission(solution) {
        let orderIds = vrpUtils.toArray(_.get(solution, 'unassigned_jobs')); // list of orders in solution
        let vehicleIds = []; // list of vehicles utilised
        _.each(solution.routes, (route) => {
            orderIds = vrpUtils.toArray(orderIds, _.map(route.act, 'job_id'));
            vehicleIds = vrpUtils.toArray(route.vehicle_id);
        });

        // check if user has permission
        await Promise.all([
            checkOrderPermission(orderIds),
            checkVehiclePermission(vehicleIds),
        ]);

        return orderIds;
    }

    async function checkOrderPermission(orderIds) {
        const scopes = [req.scopes.authz, { method: ['primaryKey', orderIds] }];
        const dbRecords = await vrpSql.DeliveryMaster.scope(scopes).findAll({
            attributes: ['Id'],
            raw: true, // query for comparision only
        });

        const invalidOrderIds = _.difference(orderIds, _.map(dbRecords, 'Id'));
        if (!_.isEmpty(invalidOrderIds)) {
            throw new Error(`Either order does not exist or not enough permissions: ${_.join(_.uniq(invalidOrderIds), ',')}`);
        }
    }

    async function checkVehiclePermission(vehicleIds) {
        const scopes = [req.scopes.authz, { method: ['primaryKey', vehicleIds] }];
        const dbRecords = await vrpSql.Vehicle.scope(scopes).findAll({
            attributes: ['Id'],
            raw: true, // query for comparision only
        });

        const invalidVehicleIds = _.difference(vehicleIds, _.map(dbRecords, 'Id'));
        if (!_.isEmpty(invalidVehicleIds)) {
            throw new Error(`Either vehicle does not exist or not enough permissions: ${_.join(_.uniq(invalidVehicleIds), ',')}`);
        }
    }

    async function validation(solution, orderIds) {
        if (_.isEmpty(solution)) {
            throw new Error('Parameter `solution` is required.');
        } else if (_.has(solution, 'unassigned_jobs') && !_.isArray(solution.unassigned_jobs)) {
            throw new Error('Parameter `solution.unassigned_jobs` must be an array.');
        } else if (_.has(solution, 'routes') && !_.isArray(solution.routes)) {
            throw new Error('Parameter `solution.routes` must be an array.');
        }

        const unassignedOrderIds = _.get(solution, 'unassigned_jobs', []);
        const dbRecords = await vrpSql.DeliveryDetail.findAll({
            where: {
                Status: [JOB.STATUS.LATE, JOB.STATUS.ONTIME],
                DeliveryMasterId: orderIds,
            },
            include: [{
                model: vrpSql.DeliveryMaster,
            }],
        });

        const invalidOrderIds = [];
        _.each(dbRecords, (job) => {
            const invalidJob = _.find(solution.routes, (route) => {
                return _.find(route.act, (act) => {
                    const isSameJobType = (_.toUpper(act.type) === _.toUpper(job.JobType));
                    const isSameDeliveryMasterId = (_.toUpper(act.job_id) === _.toUpper(job.DeliveryMasterId));
                    const isWrongVehicle = _.toUpper(route.vehicle_id) !== _.toUpper(job.DeliveryMaster.VehicleId);

                    if (isSameDeliveryMasterId && isSameJobType) {
                        return true; // Job is already completed
                    } else if (isSameDeliveryMasterId && isWrongVehicle) {
                        return true; // Order is already on-going (i.e. consist of at least 1 completed job); cannot change vehicle assignment
                    }
                });
            });

            if (!_.isEmpty(invalidJob) || _.includes(unassignedOrderIds, job.DeliveryMasterId)) {
                invalidOrderIds.push(job.DeliveryMasterId);
            }
        });

        if (!_.isEmpty(invalidOrderIds)) {
            throw new Error(`Completed jobs cannot be modified: ${_.join(_.uniq(invalidOrderIds), ',')}`);
        }
    }

    async function getAffectedVehicles(orderIds) {
        /* Get the list of vehicles that were assigned with the orders
		 * The jobs might get reassigned to another driver, and the previous driver will be lost */
        const dbRecords = await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', orderIds] }).aggregate('VehicleId', 'DISTINCT', {
            plain: false,
            where: {
                VehicleId: {
                    [vrpSql.sequelize.Op.ne]: null,
                },
            },
        });
        return _.map(dbRecords, 'DISTINCT');
    }

    function getUnsuccessfulJobs(orderIds, affectedVehicles) {
        // Get list of unsuccessful jobs
        return vrpSql.DeliveryDetail.findAll({
            where: {
                Status: JOB.STATUS.UNSUCCESSFUL,
                DeliveryMasterId: orderIds,
            },
            include: [{
                model: vrpSql.DeliveryMaster,
                attributes: ['VehicleId'],
            }],
            attributes: ['DeliveryMasterId', 'JobType'],
        });
    }

    async function getHighestRouteNums(solution, affectedVehicles, unsuccessfulJobs) {
        // assumes that the solution is always for one date
        const date = _.get(solution, 'routes[0].end_time');
        // query for highest EngineRouteSeqNum for each vehicle
        // this should not be put into the database transaction because of potential deadlock
        // previously it was placed in transaction so that the EngineRouteSeqNum of affected jobs
        // are set to null before getting the highest route numbers. the side effect not doing that
        // way is that the EngineRouteSeqNum may get extremely high
        const dbRecords = await vrpSql.DeliveryDetail.scope({ method: ['date', moment(date)] }).findAll({
            attributes: [
                'DeliveryMaster.VehicleId', [vrpSql.sequelize.fn('MAX', vrpSql.sequelize.col('EngineRouteSeqNum')), 'Max'],
            ],
            group: 'DeliveryMaster.VehicleId',
            tableHint: vrpSql.sequelize.TableHints.NOLOCK, // prevent deadlock
            include: [{
                model: vrpSql.DeliveryMaster,
                attributes: [],
            }],
            raw: true,
        });

        _.each(_.get(solution, 'routes', []), (route) => {
            const highestRouteNum = _.find(dbRecords, { VehicleId: route.vehicle_id });
            route.start_num = _.toNumber(_.get(highestRouteNum, 'Max', 0)) + 1;
        });
    }

    async function parseSolutionAndUpdateDatabase(solution, affectedVehicles, unsuccessfulJobs) {
        const affectedDates = []; // Used to notify front-end via websocket
        const validStatus = [JOB.STATUS.PENDING, JOB.STATUS.UNSUCCESSFUL, JOB.STATUS.EXPECTED_TO_BE_LATE]; // Only allow jobs of these Status to be modified

        let transaction;
        try {
            transaction = await vrpSql.sequelize.transaction();

            await Promise.each(_.get(solution, 'routes', []), async (route) => {
                if (!_.isNil(route.start_time)) {
                    affectedDates.push(moment(route.start_time).format(vrpEnum.DateFormat.DATE));
                }
                if (!_.isNil(route.end_time)) {
                    affectedDates.push(moment(route.end_time).format(vrpEnum.DateFormat.DATE));
                }
                if (!_.includes(affectedVehicles, route.vehicle_id)) {
                    // Handles the scenario where the vehicle does not have any assigned orders in the first place
                    affectedVehicles.push(route.vehicle_id);
                }

                // Filter out activities that does not has job_id field (usually means the act is depart or return)
                const validActs = _.filter(route.act, (act) => !_.isNil(act.job_id));
                const validDeliveryMasterIds = _.map(validActs, 'job_id');

                // The assumption here is that there is no completed order or half completed shipments
                // This is a safe assumption because of the validation done earlier
                await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', validDeliveryMasterIds] }).update(vrpSql.setModifiedBy(req, {
                    VehicleId: route.vehicle_id,
                }), {
                    transaction: transaction,
                });

                const currentHighestRouteSeqNum = route.start_num;
                // Set EngineRouteSeqNum for each job sequentially
                await Promise.each(validActs, async (activity, index) => {
                    const unsuccessfulJobSameDriver = _.find(unsuccessfulJobs, {
                        DeliveryMasterId: activity.job_id,
                        JobType: _.toUpper(activity.type),
                        DeliveryMaster: {
                            VehicleId: _.toUpper(route.vehicle_id),
                        },
                    });

                    /* If the unsuccessful order is not re-assigned to another driver
					 * just set EngineRouteSeqNum */
                    if (unsuccessfulJobSameDriver) {
                        await vrpSql.DeliveryDetail.update(vrpSql.setModifiedBy(req, {
                            EngineRouteSeqNum: currentHighestRouteSeqNum + index,
                        }), {
                            where: {
                                Status: JOB.STATUS.UNSUCCESSFUL,
                                DeliveryMasterId: activity.job_id,
                                JobType: _.toUpper(activity.type),
                            },
                            transaction: transaction,
                        });
                    } else {
                        await vrpSql.DeliveryDetail.update(vrpSql.setModifiedBy(req, {
                            Status: JOB.STATUS.PENDING,
                            EngineRouteSeqNum: currentHighestRouteSeqNum + index,
                            ActualDeliveryTime: null,
                            NoteFromDriver: null,
                        }), {
                            where: {
                                Status: validStatus,
                                DeliveryMasterId: activity.job_id,
                                JobType: _.toUpper(activity.type),
                            },
                            transaction: transaction,
                        });
                    }
                });
            });

            // after updating the routes, then update unassigned jobs
            if (_.has(solution, 'unassigned_jobs') && !_.isEmpty(solution.unassigned_jobs)) {
                await vrpSql.DeliveryDetail.update(vrpSql.setModifiedBy(req, {
                    Status: JOB.STATUS.PENDING,
                    ActualDeliveryTime: null,
                    EngineRouteSeqNum: null,
                    NoteFromDriver: null,
                }), {
                    where: {
                        DeliveryMasterId: solution.unassigned_jobs,
                        Status: [JOB.STATUS.PENDING, JOB.STATUS.UNSUCCESSFUL, JOB.STATUS.EXPECTED_TO_BE_LATE],
                    },
                    transaction: transaction,
                });

                await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', solution.unassigned_jobs] }).update(vrpSql.setModifiedBy(req, {
                    VehicleId: null,
                }), {
                    transaction: transaction,
                });
            }

            await transaction.commit();

            // cancel any previous schedules
            cronJob.cancel();
            // schedule this job later, in case plans are approved too close to each other, prevent over call
            cronJob.schedule(moment().add(1, 'minute').toDate());

            return affectedDates;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async function sendWebsocket(planDates, affectedVehicles) {
        const dbRecords = await vrpSql.Vehicle.scope({ method: ['primaryKey', affectedVehicles] }).findAll({
            attributes: ['UserGroup', 'DriverUsername'],
        });

        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('create')
            .setContent(_.uniq(planDates))
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.map(dbRecords, 'UserGroup'));
        message.emit(_.map(dbRecords, 'DriverUsername'));
    }
};

exports.m_getProblemJson = async (req, res, next) => {
    log.debug('m_getProblemJson', req.query);

    const planDate = _.get(req.scopes, 'date.method[1]'); // get the date values from query string
    const vehicleIds = _.get(req.query, 'vehicleIds');

    try {
        if (_.isNil(planDate)) {
            throw new Error('Date is required');
        } else if (req.scopes.date.method.length > 2) {
            throw new Error('Only date parameter is allowed'); // i.e. start date and end date not allowed
        }

        const vehicleFilter = {};
        if (vehicleIds) {
            vehicleFilter.Id = _.split(vehicleIds, ',');
        } else {
            vehicleFilter.DriverUsername = {
                [vrpSql.sequelize.Op.ne]: null,
            };
        }

        const allItems = vrpSql.Item.findAll();
        const allVehicles = vrpSql.Vehicle.scope(req.scopes.authz).findAll({
            where: vehicleFilter,
            include: [{
                model: vrpSql.VehicleType,
            }],
            order: [
                ['Id', 'ASC'],
            ],
        });

        const allOrders = vrpSql.DeliveryMaster.scope(req.scopes.authz).findAll({
            include: [{
                model: vrpSql.DeliveryDetail.scope(req.scopes.date),
                include: [{
                    model: vrpSql.DeliveryItem,
                }],
            }],
        });

        // get number of orders assigned to each vehicle
        const assignedVehicles = vrpSql.DeliveryMaster.findAll({
            where: {
                VehicleId: {
                    [vrpSql.sequelize.Op.ne]: null,
                },
            },
            include: [{
                model: vrpSql.DeliveryDetail.scope(req.scopes.date),
                attributes: [],
            }],
            attributes: [
                vrpSql.sequelize.col('VehicleId'),
                [vrpSql.sequelize.fn('COUNT', vrpSql.sequelize.col('VehicleId')), 'count'],
            ],
            group: 'VehicleId',
            raw: true,
        });

        const [items, vehicles, orders, assignment] = await Promise.all([allItems, allVehicles, allOrders, assignedVehicles]);
        req.answer = req.problem = _mapSqlDataToProblemJson(items, vehicles, orders, assignment, planDate);

        next();
    } catch (err) {
        next(err);
    }
};

function _mapSqlDataToProblemJson(sqlItems, sqlVehicles, sqlDeliveryMaster, sqlAssignedCount, planDate) {
    const vehicleTypes = []; // populate vehicle type if relevant vehicles are included

    const vehicles = _.reduce(sqlVehicles, (list, vehicle) => {
        const vehicleType = vehicle.VehicleType;

        // ignore vehicles that do not have vehicle type
        if (vehicleType) {
            // check if vehicle type already exist in problem vehicle types list
            const vehicleTypeExists = _.find(vehicleTypes, { id: vehicleType.Name });
            if (!vehicleTypeExists) {
                vehicleTypes.push({
                    id: vehicleType.Name,
                    name: vehicleType.Name,
                    capacity: [vehicleType.Capacity],
                    fixed_costs: vehicleType.FixedCost,
                    distance_dependent_costs: vehicleType.DistanceCost * 1000 / 3600,
                    time_dependent_costs: vehicleType.TravelTimeCost / 3600,
                    waiting_time_dependent_costs: vehicleType.WaitingTimeCost / 3600,
                });
            }

            // get number of jobs assigned to the vehicle
            const vehicleJobAssignment = _.find(sqlAssignedCount, { VehicleId: vehicle.Id });

            list.push({
                id: vehicle.Id,
                type_id: vehicleType.Name,
                driver_name: vehicle.DriverUsername,
                start_address: {
                    id: `Start_${vehicle.Id}`,
                    postal: vehicle.StartAddressPostal,
                    lat: vehicle.StartAddressLat,
                    lon: vehicle.StartAddressLng,
                },
                end_address: (!vehicle.EndAddressPostal) ? undefined : {
                    id: vehicle.EndAddressPostal,
                    postal: vehicle.EndAddressPostal,
                    lat: vehicle.EndAddressLat,
                    lon: vehicle.EndAddressLng,
                },
                return_to_depot: vehicle.ReturnToEndAddress,
                earliest_start: _convertTimeOnlyToDatetime(planDate, vehicle.StartTime),
                latest_end: _convertTimeOnlyToDatetime(planDate, vehicle.EndTime),
                num_assigned: _.get(vehicleJobAssignment, 'count', 0),
                max_num_job: (!vehicle.MaxNumJobs) ? 1000 : vehicle.MaxNumJobs, // if value missing, assume unlimited / no max
                usergroup: (!vehicle.UserGroup) ? undefined : vehicle.UserGroup,
            });
        }

        return list;
    }, []);

    // split orders into two lists - services and shipments (remaining items in sqlDeliveryMaster are shipments)
    const serviceList = _.remove(sqlDeliveryMaster, (order) => order.DeliveryDetails.length === 1);

    const services = _.reduce(serviceList, (list, order) => {
        const job = _.first(order.DeliveryDetails);

        // ignore orders that do not have job
        if (job) {
            list.push({
                id: order.Id,
                name: order.CustomerName,
                type: _.toLower(job.JobType),
                size: [_getTotalWeight(job.DeliveryItems, sqlItems)], // standardise all items unit
                address: {
                    id: job.Postal,
                    postal: job.Postal,
                    name: job.ContactName,
                    address: job.Address,
                    lat: job.Lat,
                    lon: job.Lng,
                },
                service_duration: job.ServiceTime * 60,
                time_windows: [_getTimeWindowFromJob(job)],
                allowed_vehicles: order.VehicleRestriction ? order.VehicleRestriction.split(',') : null,
                assigned_to: order.VehicleId,
                priority: order.Priority,
                status: job.Status,
                usergroup: order.UserGroup,
            });
        }

        return list;
    }, []);

    const shipments = _.reduce(sqlDeliveryMaster, (list, order) => {
        const pickup = _.find(order.DeliveryDetails, { JobType: JOB.TYPE.PICKUP });
        const delivery = _.find(order.DeliveryDetails, { JobType: JOB.TYPE.DELIVERY });

        // ignore orders that do not have job
        if (pickup && delivery) {
            list.push({
                id: order.Id,
                name: order.CustomerName,
                size: [_getTotalWeight(pickup.DeliveryItems, sqlItems)], // standardise all items unit
                type: 'shipment',
                pickup_address: {
                    id: pickup.Postal,
                    postal: pickup.Postal,
                    name: pickup.ContactName,
                    address: pickup.Address,
                    lat: pickup.Lat,
                    lon: pickup.Lng,
                },
                pickup_duration: pickup.ServiceTime * 60,
                pickup_time_windows: [_getTimeWindowFromJob(pickup)],
                pickup_status: pickup.Status,
                delivery_address: {
                    id: delivery.Postal,
                    postal: delivery.Postal,
                    name: delivery.ContactName,
                    address: delivery.Address,
                    lat: delivery.Lat,
                    lon: delivery.Lng,
                },
                delivery_duration: delivery.ServiceTime * 60,
                delivery_time_windows: [_getTimeWindowFromJob(delivery)],
                delivery_status: delivery.Status,
                allowed_vehicles: order.VehicleRestriction ? order.VehicleRestriction.split(',') : null,
                assigned_to: order.VehicleId,
                priority: order.Priority,
                usergroup: order.UserGroup,
            });
        }

        return list;
    }, []);

    const _id = `p_planner_${moment(planDate).format(vrpEnum.DateFormat.DATE)}`;
    const problem = {
        _id: _id,
        name: _id,
        items: [{ id: 'Weight', weight: 1, description: 'in Kg' }], // standardise all items unit
        vehicle_types: vehicleTypes,
        vehicles: vehicles,
        services: services,
        shipments: shipments,
    };
    return problem;
}

function _getTotalWeight(deliveryItems, items) {
    // merge all of the delivery items weight together since they are all the same unit for this system
    return _.reduce(deliveryItems, (totalWeight, deliveryItem) => {
        // since in the past, item Id can be mixed case, have to ensure the check is correct
        const item = _.find(items, (item) => (vrpUtils.isSameText(item.Id, deliveryItem.ItemId)));
        const weight = _.get(item, 'Weight', 0) * deliveryItem.ItemQty;
        return totalWeight + weight;
    }, 0);
}

/**
 * Convert time window values from `DeliveryDetail` table into engine time window format
 * @param {Object} job  Instance from DeliveryDetail table
 * @returns {Object}  `{ start: <%_Date_%>, end: <%_Date_%> }` format, where `<%_Date_%>` is in a datetime format compatible with engine
 */
function _getTimeWindowFromJob(job) {
    return {
        start: moment(job.StartTimeWindow).utcOffset(TIMEZONE).format(vrpEnum.DateFormat.ENGINE).toString(),
        end: moment(job.EndTimeWindow).utcOffset(TIMEZONE).format(vrpEnum.DateFormat.ENGINE).toString(),
    };
}

/**
 * Add date and timezone values to time only (HH:mm)
 * @param {Date|moment|String} date  Date value in preferably `Date` or `moment` type
 * @param {String} time  Time value in HH:mm format
 * @returns {String}  ISO8601 datetime format without seconds
 */
function _convertTimeOnlyToDatetime(date, time) {
    const formattedDate = moment(date).format(vrpEnum.DateFormat.DATE).toString();
    return `${formattedDate}T${time}${TIMEZONE}`;
}
