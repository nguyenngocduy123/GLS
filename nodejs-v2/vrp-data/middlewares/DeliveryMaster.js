/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Data');

const _ = require('lodash');
const Promise = require('bluebird');
const { ORDER } = require('../classes');
const vrpSql = require('../../vrp-sql');
const vrpUtils = require('../../vrp-common/utils');
const vrpEnum = require('../../enum');
const vrpConfig = require('../../configuration');
const vrpUserUtils = require('../../vrp-user/user-utils');
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.ORDER;
const MAX_BULK_DELETE_COUNT = vrpConfig.get('database.sql.custom.maxDeleteCount');
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneDeliveryMaster', req.user.username);

    const id = req.params.deliveryMasterId;

    try {
        const scopes = [req.scopes.authz, { method: ['primaryKey', id] }];
        const dbRecord = await vrpSql.DeliveryMaster.scope(scopes).findOne({
            include: [{
                model: vrpSql.DeliveryDetail,
                include: [
                    vrpSql.DeliveryItem,
                    vrpSql.VerificationCode,
                ],
            }],
        });

        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllDeliveryMaster', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        if (_.isEmpty(where) && _.isEmpty(req.scopes.date)) {
            throw new Error('Either where parameter or date/startDate/endDate parameters must be specified');
        }

        const dbRecords = await vrpSql.DeliveryMaster.scope(req.scopes.authz).findAll({
            where: _.omit(where, ['DeliveryDetail']),
            include: [{
                model: vrpSql.DeliveryDetail.scope(req.scopes.date),
                where: _.get(where, 'DeliveryDetail'),
                include: [
                    vrpSql.DeliveryItem,
                    vrpSql.VerificationCode,
                ],
            }],
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createDeliveryMaster', req.user.username);

    const records = vrpUtils.toArray(_.get(req.body, 'record'));
    // current usergroup. used to check if user can create record with UserGroup specified
    const usergroup = _.get(req, 'scopes.authz.method[1]');

    try {
        validateParams();
        await validateRecords();

        const insertedRecords = await insertDatabase();

        req.answer = vrpSql.DeliveryMaster.getPrimaryKeyValues(insertedRecords);
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(insertedRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(records)) {
            throw new Error('Parameter `record` is required.');
        } else if (usergroup === undefined) {
            throw new Error('Current user\'s usergroup is unknown');
        }
    }

    async function validateRecords() {
        const errors = [];
        await Promise.each(records, async (record) => {
            try {
                record.DeliveryDetails = _.map(record.DeliveryDetails, (job) => {
                    job.DeliveryMasterId = record.Id;
                    return job;
                });

                if (!_.has(record, 'DeliveryDetails') || _.isEmpty(record.DeliveryDetails)) {
                    throw new Error('Parameter `record.DeliveryDetails` is required.');
                } else if (!_.isArray(record.DeliveryDetails)) {
                    throw new Error('Parameter `record.DeliveryDetails` must be an array.');
                } else if (_.has(record, 'DeliveryDetails.DeliveryItems') && !_.isArray(record.DeliveryDetails.DeliveryItems)) {
                    throw new Error('Parameter `record.DeliveryDetails.DeliveryItems` must be an array.');
                } else if (_.has(record, 'DeliveryDetails.VerificationCode') && _.isArray(record.DeliveryDetails.VerificationCode)) {
                    throw new Error('Parameter `record.DeliveryDetails.VerificationCode` must be a JSON object.');
                } else if (!_.isNil(record.VehicleRestriction)) {
                    const formattedVehicleRestriction = await validateVehicleRestrictionCol(req, record);
                    record.VehicleRestriction = formattedVehicleRestriction;
                } else if (!_.isNil(usergroup) && !vrpUtils.isSameText(record.UserGroup, usergroup)) {
                    // if not super planner, then can only create order for the same usergroup
                    throw new Error(`UserGroup can only be ${usergroup}.`);
                } else if (!_.isEmpty(record.UserGroup)) {
                    const invalidUsergroup = await vrpUserUtils.checkUserGroupsExist(record.UserGroup);
                    if (!_.isEmpty(invalidUsergroup)) {
                        throw new Error(`UserGroup ${record.UserGroup} does not exist.`);
                    }
                }
            } catch (err) {
                errors.push(`Order ${record.Id}. ${vrpUtils.parseError(err, false)}`);
            }
        });

        if (!_.isEmpty(errors)) {
            throw errors;
        }
    }

    async function insertDatabase() {
        let transaction;
        try {
            transaction = await vrpSql.sequelize.transaction();

            const dbRecords = await Promise.map(records, (record) => {
                try {
                    return vrpSql.DeliveryMaster.create(vrpSql.setCreatedBy(req, record), {
                        returning: true,
                        include: [{
                            model: vrpSql.DeliveryDetail,
                            include: [
                                vrpSql.DeliveryItem,
                                vrpSql.VerificationCode,
                            ],
                        }],
                        transaction: transaction,
                    });
                } catch (err) {
                    throw new Error(`Order ${record.Id}. ${vrpUtils.parseError(err, false)}`);
                }
            });

            await transaction.commit();
            return dbRecords;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    function sendWebsocket(insertedRecords) {
        // group messages by usergroup
        const plannerMessages = _.groupBy(insertedRecords, 'UserGroup');
        _.each(plannerMessages, (orders, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('create')
                .setContent(orders)
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });
    }
};

exports.m_bulkDelete = async (req, res, next) => {
    log.debug('m_bulkDeleteDeliveryMaster', req.user.username);

    const orderIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    try {
        validateParams();

        const dbRecords = await checkPermission(); // check if user has permission

        const rowCount = await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', orderIds] }).destroy();
        req.answer = rowCount;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(orderIds)) {
            throw new Error('Parameter `ids` is required.');
        } else if (orderIds.length > MAX_BULK_DELETE_COUNT) {
            throw new Error(`Maximum number of records allowed to be deleted is ${MAX_BULK_DELETE_COUNT}.`);
        }
    }

    async function checkPermission() {
        const scopes = [req.scopes.authz, { method: ['primaryKey', orderIds] }];
        const affectedOrders = await vrpSql.DeliveryMaster.scope(scopes).findAll({
            include: [{
                model: vrpSql.Vehicle,
            }],
        });

        const invalidOrderIds = _.differenceBy(orderIds, _.map(affectedOrders, 'Id'), _.toNumber);
        if (!_.isEmpty(invalidOrderIds)) {
            throw new Error(`Either order does not exist or not enough permissions: ${_.join(invalidOrderIds, ',')}`);
        }

        return affectedOrders;
    }

    function sendWebsocket(deletedRecords) {
        // group messages by usergroup
        const plannerMessages = _.groupBy(deletedRecords, 'UserGroup');
        _.each(plannerMessages, (orders, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('delete')
                .setContent(_.map(orders, 'Id'))
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });

        // group messages by driver username
        const driverMessages = _.groupBy(deletedRecords, 'Vehicle.DriverUsername');
        _.each(driverMessages, (orders, driverUsername) => {
            // `_.groupBy` will convert objects into strings
            if (!_.isEmpty(driverUsername) && driverUsername !== 'undefined' && driverUsername !== 'null') {
                new VrpSocketMessage(SOCKET_TOPIC)
                    .setPurpose('delete')
                    .setContent(_.map(orders, 'Id'))
                    .setSender(req.user)
                    .emit(driverUsername);
            }
        });
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateDeliveryMaster', req.user.username);

    const id = req.params.deliveryMasterId;
    const newValues = _.get(req.body, 'newValues', {});
    // current usergroup. used to check if user can update record with UserGroup specified
    const usergroup = _.get(req, 'scopes.authz.method[1]');

    const scopes = [req.scopes.authz, { method: ['primaryKey', id] }];

    try {
        validateParams();
        await validateRecords();

        const dbRecord = await checkPermission(); // check if user has permission

        const originalUserGroup = dbRecord.UserGroup;

        await dbRecord.update(vrpSql.setModifiedBy(req, newValues));
        req.answer = 1;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(originalUserGroup);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        const newValuesId = newValues[vrpSql.DeliveryMaster.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        } else if (usergroup === undefined) {
            throw new Error('Current user\'s usergroup is unknown');
        }
    }

    async function validateRecords() {
        if (!_.isNil(usergroup) && !vrpUtils.isSameText(newValues.UserGroup, usergroup)) {
            // if not super planner, then can only update order to the same usergroup
            throw new Error(`UserGroup can only be ${usergroup}.`);
        } else if (!_.isNil(newValues.UserGroup)) {
            const invalidUsergroup = await vrpUserUtils.checkUserGroupsExist(newValues.UserGroup);
            if (!_.isEmpty(invalidUsergroup)) {
                throw new Error(`UserGroup ${newValues.UserGroup} does not exist.`);
            }
        }

        if (!_.isNil(newValues.VehicleRestriction)) {
            newValues.VehicleRestriction = await validateVehicleRestrictionCol(req, newValues);
        }
    }

    async function checkPermission() {
        const affectedOrder = await vrpSql.DeliveryMaster.scope(scopes).findOne();
        if (_.isEmpty(affectedOrder)) {
            throw new Error(`Either order does not exist or not enough permissions: ${id}`);
        } else if (_.has(newValues, 'VehicleId') && !vrpUtils.isSameText(affectedOrder.VehicleId, newValues.VehicleId)) {
            throw new Error('Use DeliveryPlan Approve API to change VehicleId assignment.');
        }
        return affectedOrder;
    }

    async function sendWebsocket(userGroupBeforeUpdate) {
        // need to query database to get eager loaded information
        const dbRecord = await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryDetail,
            }],
        });

        if (!_.isEmpty(dbRecord)) {
            // check if need to notify previous usergroup that the order can no longer be viewed
            if (!_.isEmpty(userGroupBeforeUpdate) && userGroupBeforeUpdate !== dbRecord.UserGroup) {
                new VrpSocketMessage(SOCKET_TOPIC)
                    .setPurpose('delete')
                    .setContent(_.get(dbRecord, 'Id'))
                    .setSender(req.user)
                    .broadcast(vrpEnum.UserRole.PLANNER, userGroupBeforeUpdate);
            }

            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('update')
                .setContent(dbRecord)
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, _.get(dbRecord, 'UserGroup'));
        }
    }
};

async function validateVehicleRestrictionCol(req, record) {
    const vehicleRestrictionValue = _.toUpper(_.trim(record.VehicleRestriction));
    if (_.isEmpty(vehicleRestrictionValue)) {
        return Promise.resolve(null);
    }

    const restrictions = ORDER.groupVehicleRestriction(vehicleRestrictionValue);

    const vehicleList = _.uniq(vrpUtils.toArray(restrictions.allowedVehicles, restrictions.blockedVehicles));
    const vehicleTypeList = _.uniq(vrpUtils.toArray(restrictions.allowedVehicleTypes, restrictions.blockedVehicleTypes));

    const [vehicles, vehicleTypes] = await Promise.join(
        vrpSql.Vehicle.scope([req.scopes.authz, { method: ['primaryKey', vehicleList] }]).findAll({
            attributes: ['Id', 'UserGroup'],
            raw: true,
        }),
        vrpSql.VehicleType.findAll({
            where: {
                Name: vehicleTypeList,
            },
            attributes: ['Id'],
            raw: true,
        })
    );

    // check if record is authorised to use the vehicles
    const unauthorisedVehicle = _.find(vehicles, (vehicle) => !vrpUtils.isSameText(vehicle.UserGroup, record.UserGroup));
    if (!_.isNil(record.UserGroup) && !_.isEmpty(unauthorisedVehicle)) {
        throw new Error(`Not allowed to use Vehicle ${unauthorisedVehicle.Id} of another UserGroup`);
    } else if (vehicles.length !== vehicleList.length) {
        throw new Error(`VehicleRestriction column has invalid Vehicle. Number of invalid Vehicle: ${(vehicleList.length - vehicles.length)}`);
    } else if (vehicleTypes.length !== vehicleTypeList.length) {
        throw new Error(`VehicleRestriction column has invalid VehicleType. Number of invalid VehicleType: ${(vehicleTypeList.length - vehicleTypes.length)}`);
    }

    return vehicleRestrictionValue;
}
