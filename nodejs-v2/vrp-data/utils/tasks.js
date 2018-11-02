/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('vrpData');

const _ = require('lodash');
const moment = require('moment');
const { JOB } = require('../classes');
const mail = require('../utils/mail');
const vrpSql = require('../../vrp-sql');
const vrpEnum = require('../../enum');
const vrpUtils = require('../../vrp-common/utils');
const vrpMongo = require('../../vrp-common/mongo');
const { VrpSocketMessage } = require('../../vrp-common/socket');
const vrpMeasure = require('../../vrp-map-service/vrp-measure-v2');

let colVehicleLastSeen = null;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colVehicleLastSeen = await vrpMongo.getCollection(mongoDb, 'vehiclelastseen');
});

/**
 * Send verification code notification email to all orders for today. "Today" is based on
 * server's current time in `moment()`.
 * @returns {void}
 */
exports.dailyVerificationCode = async () => {
    log.info('(Task) Send verification code email to today\'s orders');

    try {
        const dbRecords = await vrpSql.DeliveryDetail.scope([{
            method: ['date', moment()],
        }]).findAll({
            attributes: ['Id'],
        });

        if (dbRecords.length > 0) {
            return mail.verificationCode(_.map(dbRecords, 'Id'));
        }
    } catch (err) {
        log.error('(Task) Verification code email error', err);
    }
};

/**
 * Check each job for today on whether it is expected to be late.
 * Modified jobs are then sent to planners and drivers via websocket.
 * The starting point of each route is based on the vehicle's last seen location for
 * today. If there is no last seen location, the start address of the vehicle is used.
 * A job is expected to be late if the driver is unable to complete the job by the `EndTimeWindow`.
 * @returns {void}
 */
exports.updateExpectedToBeLate = async () => {
    log.info('(Task) Update expect to be late status');

    /** @typedef {Object.<string, Object[]>} websocketMessage */
    /**
	 * Stores list of modified jobs to send as websocket message to drivers (usernames).
	 * Key `x` is the username of the driver.
	 * Value is the list of modified jobs (instance(s) of DeliveryDetail table).
	 */
    /** @type websocketMessage */
    let jobsDriverWebsocketMsg = {};

    /**
	 * Stores list of modified jobs to send as websocket message to planners (usergroup).
	 * Key `x` is the usergroup.
	 * Value is the list of modified jobs (instance(s) of DeliveryDetail table).
	 */
    /** @type websocketMessage */
    let jobsWebsocketPlannerMsg = {};

    try {
        const jobs = await vrpSql.DeliveryDetail.scope([{
            method: ['date', moment()], // get jobs for today's date only
        }]).findAll({
            where: {
                Status: [ // get pending jobs only
                    JOB.STATUS.PENDING,
                    JOB.STATUS.EXPECTED_TO_BE_LATE,
                ],
            },
            order: ['EngineRouteSeqNum'], // order by route sequence
            include: [{
                model: vrpSql.DeliveryMaster,
                where: {
                    VehicleId: {
                        [vrpSql.sequelize.Op.ne]: null, // get assigned orders only
                    },
                },
            }],
        });

        if (jobs.length === 0) {
            const error = new Error('No jobs to check.');
            error.name = 'NoJobs';
            throw error;
        }

        // get list of vehicles utilised
        const uniqueVehicleIdList = _.reduce(jobs, (list, job) => {
            const vehicleId = job.DeliveryMaster.VehicleId;
            if (_.indexOf(list, vehicleId) < 0) {
                list.push(vehicleId);
            }
            return list;
        }, []);

        const vehicles = await vrpSql.Vehicle.scope([{
            method: ['primaryKey', uniqueVehicleIdList],
        }]).findAll({
            raw: true, // `raw` improves performance and ok to use because no eager-loading is required here
        });

        _.each(vehicles, (vehicle) => {
            // assume the last seen location is at start address
            vehicle.LastSeenLat = vehicle.StartAddressLat;
            vehicle.LastSeenLng = vehicle.StartAddressLng;
        });

        // get vehicle's last seen location for today
        const lastseenLogs = await colVehicleLastSeen.aggregate([{
            $match: {
                VehicleId: {
                    $in: uniqueVehicleIdList, // get necessary records only
                },
                RecordedTime: {
                    $gte: moment().toDate(), // get today's records only
                    $lt: moment().add('1', 'day').toDate(),
                },
            },
        }, {
            $group: {
                _id: '$VehicleId', // group by VehicleId
                LastSeenLat: {
                    $last: { $arrayElemAt: ['$Coordinates', 1] }, // get the most recent record only ($last)
                },
                LastSeenLng: {
                    $last: { $arrayElemAt: ['$Coordinates', 0] },
                },
                VehicleId: { $last: '$VehicleId' },
            },
        }]).toArray();

        _.each(lastseenLogs, (lastseen) => {
            const vehicle = _.find(vehicles, { Id: lastseen.VehicleId });
            _.extend(vehicle, lastseen);
        });

        // calculate the time taken to execute the routes
        const routes = _.groupBy(jobs, 'DeliveryMaster.VehicleId'); // group into routes (one vehicle = one route)
        _.each(routes, (route, vehicleId) => {
            const vehicle = _.find(vehicles, { Id: vehicleId });
            const driverUsername = _.get(vehicle, 'DriverUsername');

            const req = {
                body: {
                    coordinates: _.reduce(route, (sequence, job) => {
                        sequence.push([job.Lat, job.Lng]);
                        return sequence;
                    }, [
                        [vehicle.LastSeenLat, vehicle.LastSeenLng],
                    ]),
                },
            };

            // check expected status of each job
            vrpMeasure.m_route(req, null, async (err) => {
                if (!_.isNil(err)) {
                    // ignore this route and continue with others
                    return log.error(`Cannot calculate route for ${vehicleId}. Error:`, err);
                }

                let routeTotalTimeSecs = 0; // add each job's travel time
                await Promise.all(_.map(_.get(req.answer, 'routes[0].legs'), (leg, i) => {
                    const job = _.get(route, i); // get job to do in this `i` sequence position

                    const timeRequiredForJob = leg.duration + (job.ServiceTime * 60); // time to travel to job and service time in seconds
                    routeTotalTimeSecs += timeRequiredForJob;

                    const expectedDoneTime = moment().add(routeTotalTimeSecs, 'seconds');
                    const expectedDoneTimeStr = expectedDoneTime.format('HH:mm');

                    // job is counted as expected to be late if driver is expected to finish a job after `EndTimeWindow`
                    if (!JOB.isExpectedToBeLate(job) && expectedDoneTime.isAfter(job.EndTimeWindow)) {
                        log.trace(`(Task) Job ${job.Id} is expected to be late at ${expectedDoneTimeStr}`);
                        // update status only if the original status is not expected to be late (reduce database requests)
                        return updateJobInDb(job, driverUsername, JOB.STATUS.EXPECTED_TO_BE_LATE);

                    } else if (JOB.isExpectedToBeLate(job) && expectedDoneTime.isSameOrBefore(job.EndTimeWindow)) {
                        log.trace(`(Task) Job ${job.Id} revert status to pending. Time: ${expectedDoneTimeStr}`);
                        // this step is required because if the job was expected to be late and its timewindow modified, then the status may not be the same
                        return updateJobInDb(job, driverUsername, JOB.STATUS.PENDING);
                    }
                }));

                _.each(jobsWebsocketPlannerMsg, (message, usergroup) => {
                    new VrpSocketMessage(vrpEnum.SocketTopic.JOB)
                        .setPurpose('update')
                        .setContent(message)
                        .setSender(req.user)
                        .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
                    jobsWebsocketPlannerMsg = _.omit(jobsWebsocketPlannerMsg, usergroup); // remove job from ws list
                });

                _.each(jobsDriverWebsocketMsg, (message, driverUsername) => {
                    new VrpSocketMessage(vrpEnum.SocketTopic.JOB)
                        .setPurpose('update')
                        .setContent(message)
                        .setSender(req.user)
                        .emit(driverUsername);
                    jobsDriverWebsocketMsg = _.omit(jobsDriverWebsocketMsg, driverUsername); // remove job from ws list
                });
            });
        });

    } catch (err) {
        if (!err instanceof Error || err.name !== 'NoJobs') {
            log.warn('(Task) Expect to be late,', err);
        }
    }

    async function updateJobInDb(job, driverUsername, status) {
        try {
            await job.update({ Status: status }).then(() => {
                const message = _.pick(job, ['Id', 'Status']); // only send necessary information

                // push job to list of modified jobs to send as websocket message
                const usergroup = _.get(job, 'DeliveryMaster.UserGroup');
                jobsWebsocketPlannerMsg[usergroup] = jobsWebsocketPlannerMsg[usergroup] || [];
                jobsWebsocketPlannerMsg[usergroup].push(message);

                jobsDriverWebsocketMsg[driverUsername] = jobsDriverWebsocketMsg[driverUsername] || [];
                jobsDriverWebsocketMsg[driverUsername].push(message);
            });
        } catch (err) {
            // assume update successfully
            log.warn('(Task) Fail to update database for expect late status', err);
        }
    }
};
