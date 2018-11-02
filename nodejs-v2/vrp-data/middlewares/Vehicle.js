/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Data');

const _ = require('lodash');
const vrpSql = require('../../vrp-sql');
const vrpUtils = require('../../vrp-common/utils');
const vrpEnum = require('../../enum');
const vrpConfig = require('../../configuration');
const vrpUserUtils = require('../../vrp-user/user-utils');
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.VEHICLE;
const MAX_BULK_DELETE_COUNT = vrpConfig.get('database.sql.custom.maxDeleteCount');
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneVehicle', req.user.username);

    const id = req.params.vehicleId;

    try {
        const scopes = [req.scopes.authz, { method: ['primaryKey', id] }];
        const dbRecord = await vrpSql.Vehicle.scope(scopes).findOne({
            include: [{
                model: vrpSql.VehicleType,
            }],
        });

        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllVehicle', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        const dbRecords = await vrpSql.Vehicle.scope(req.scopes.authz).findAll({
            where: _.omit(where, ['VehicleType']),
            include: [{
                model: vrpSql.VehicleType,
                where: _.get(where, 'VehicleType'),
            }],
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createVehicle', req.user.username);

    const records = vrpUtils.toArray(_.get(req.body, 'record'));
    // current usergroup. used to check if user can create record with UserGroup specified
    const usergroup = _.get(req, 'scopes.authz.method[1]');

    try {
        validateParams();
        await validateRecords();

        await checkPermission();

        const dbRecords = await insertDatabase();
        req.answer = vrpSql.Vehicle.getPrimaryKeyValues(dbRecords);
        next();

        vrpUtils.silenceError(sendWebsocket)(req.answer);
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
        const driverUsernames = [];
        const usergroups = [];
        for (const record of records) {
            if (!_.isNil(usergroup) && !vrpUtils.isSameText(record.UserGroup, usergroup)) {
                // if not super planner, then can only create vehicle for the same usergroup
                throw new Error(`UserGroup can only be ${usergroup}.`);
            }

            if (!_.isEmpty(record.UserGroup)) {
                // check usergroup validity later
                usergroups.push(record.UserGroup);
            }

            if (!_.isEmpty(record.DriverUsername)) {
                // check username validity later
                driverUsernames.push(record.DriverUsername);
            }
        }

        if (!_.isEmpty(driverUsernames)) {
            const invalidUsernames = await vrpUserUtils.checkIfValidDrivers(driverUsernames);
            if (!_.isEmpty(invalidUsernames)) {
                throw new Error(`DriverUsername ${_.join(invalidUsernames, ', ')} does not exist/disabled.`);
            }
        }

        if (!_.isEmpty(usergroups)) {
            const invalidUsergroups = await vrpUserUtils.checkUserGroupsExist(usergroups);
            if (!_.isEmpty(invalidUsergroups)) {
                throw new Error(`UserGroup ${_.join(invalidUsergroups, ', ')} does not exist.`);
            }
        }
    }

    async function checkPermission() {
        // check if vehicletype exists and if user has permission
        const vehicleTypeIds = vrpUtils.toArray(_.map(records, 'VehicleTypeId'));
        const dbRecords = await vrpSql.VehicleType.scope({ method: ['primaryKey', vehicleTypeIds] }).findAll({
            attributes: ['Id', 'Name'],
            raw: true, // query for comparison only
        });

        const invalidVehicleTypeIds = _.difference(vehicleTypeIds, _.map(dbRecords, 'Id'));
        // convert Id to Name before returning as error response
        const invalidVehicleTypeNames = _.reduce(invalidVehicleTypeIds, (list, id) => {
            const vehicleType = _.find(dbRecords, { Id: id });
            if (_.has(vehicleType, 'Name') && _.indexOf(list, vehicleType.Name) < 0) {
                list.push(vehicleType.Name);
            }
            return list;
        }, []);

        if (!_.isEmpty(invalidVehicleTypeIds)) {
            throw new Error(`Either vehicleType does not exist or not enough permissions: ${_.join(invalidVehicleTypeNames, ',')}`);
        }
    }

    function insertDatabase() {
        return vrpSql.Vehicle.bulkCreate(vrpSql.setCreatedBy(req, records), {
            returning: true,
        });
    }

    async function sendWebsocket(insertedIds) {
        // need to query database to get eager loaded information
        const scopes = [req.scopes.authz, { method: ['primaryKey', insertedIds] }];
        const dbRecords = await vrpSql.Vehicle.scope(scopes).findAll({
            include: {
                model: vrpSql.VehicleType,
            },
        });

        // group messages by usergroup
        const plannerMessages = _.groupBy(dbRecords, 'UserGroup');
        _.each(plannerMessages, (vehicles, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('create')
                .setContent(vehicles)
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });

        // different drivers have different vehicles, so message needs to be emitted separately
        _.each(dbRecords, (vehicle) => {
            if (vehicle.DriverUsername) {
                new VrpSocketMessage(SOCKET_TOPIC)
                    .setPurpose('create')
                    .setContent(_.pick(vehicle, ['Id', 'PlateNumber', 'UserGroup']))
                    .setSender(req.user)
                    .emit(vehicle.DriverUsername);
            }
        });
    }
};

exports.m_bulkDelete = async (req, res, next) => {
    log.debug('m_bulkDeleteVehicle', req.user.username);

    const vehicleIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    try {
        validateParams();

        const dbRecords = await checkPermission(); // check if user has permission

        const rowCount = await vrpSql.Vehicle.scope({ method: ['primaryKey', vehicleIds] }).destroy();
        req.answer = rowCount;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(vehicleIds)) {
            throw new Error('Parameter `ids` is required.');
        } else if (vehicleIds.length > MAX_BULK_DELETE_COUNT) {
            throw new Error(`Maximum number of records allowed to be deleted is ${MAX_BULK_DELETE_COUNT}.`);
        }
    }

    async function checkPermission() {
        const scope = [req.scopes.authz, { method: ['primaryKey', vehicleIds] }];
        const affectedVehicles = await vrpSql.Vehicle.scope(scope).findAll({
            attributes: ['Id', 'UserGroup'],
            raw: true, // query for comparision only
        });

        const invalidVehicleIds = _.differenceBy(vehicleIds, _.map(affectedVehicles, 'Id'), _.toNumber);
        if (!_.isEmpty(invalidVehicleIds)) {
            throw new Error(`Either vehicle does not exist or not enough permissions: ${_.join(invalidVehicleIds, ',')}`);
        }
        return affectedVehicles;
    }

    function sendWebsocket(deletedRecords) {
        // group messages by usergroup
        const plannerMessages = _.groupBy(deletedRecords, 'UserGroup');
        _.each(plannerMessages, (vehicles, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('delete')
                .setContent(_.map(vehicles, 'Id'))
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateVehicle', req.user.username);

    const id = req.params.vehicleId;
    let newValues = _.get(req.body, 'newValues', {});
    // current usergroup. used to check if user can update record with UserGroup specified
    const usergroup = _.get(req, 'scopes.authz.method[1]');

    try {
        await validateParams();
        await validateNewValues();

        const dbRecord = await checkPermission(); // check if user has permission

        const originalValues = dbRecord.toJSON();

        await updateDatabase(dbRecord);
        req.answer = 1;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(originalValues, dbRecord);
        }
    } catch (err) {
        next(err);
    }

    async function validateParams() {
        const newValuesId = newValues[vrpSql.Vehicle.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        } else if (usergroup === undefined) {
            throw new Error('Current user\'s usergroup is unknown');
        } else if (!_.isNil(usergroup) && !vrpUtils.isSameText(newValues.UserGroup, usergroup)) {
            // if not super planner, then can only update vehicle to the same usergroup
            throw new Error(`UserGroup can only be ${usergroup}.`);
        } else if (!_.isNil(newValues.UserGroup)) {
            const invalidUsergroup = await vrpUserUtils.checkUserGroupsExist(newValues.UserGroup);
            if (!_.isEmpty(invalidUsergroup)) {
                throw new Error(`UserGroup ${newValues.UserGroup} does not exist.`);
            }
        }
    }

    async function validateNewValues() {
        if (vrpUserUtils.isDriver(req.user)) {
            // validate driver input
            if (!_.has(newValues, 'PlateNumber')) {
                throw new Error('Driver can only update PlateNumber.');
            }
            newValues = _.pick(newValues, 'PlateNumber');
        } else {
            // check if assigned to valid driverusername
            if (_.has(newValues, 'DriverUsername')) {
                const invalidUsernames = await vrpUserUtils.checkIfValidDrivers(newValues.DriverUsername);
                if (!_.isEmpty(invalidUsernames)) {
                    throw new Error(`DriverUsername ${_.join(invalidUsernames, ', ')} does not exist/disabled.`);
                }
            }
        }
    }

    async function checkPermission() {
        const affectedVehicle = await queryForRecord();
        if (_.isEmpty(affectedVehicle)) {
            throw new Error(`Either vehicle does not exist or not enough permissions: ${id}}`);
        }
        return affectedVehicle;
    }

    function updateDatabase(dbRecord) {
        let where = {};
        if (vrpUserUtils.isDriver(req.user)) {
            where = {
                DriverUsername: req.user.username,
            };
        }

        return dbRecord.update(vrpSql.setModifiedBy(req, newValues), { where: where });
    }

    async function sendWebsocket(originalValues, updatedRecord) {
        // check if need to notify previous driver that the vehicle has been unassigned
        const driverBeforeUpdate = originalValues.DriverUsername;
        if (driverBeforeUpdate && driverBeforeUpdate !== updatedRecord.DriverUsername) {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('update')
                .setContent({ Id: null, PlateNumber: null, UserGroup: null })
                .setSender(req.user)
                .emit(driverBeforeUpdate);
        }

        // check if need to notify previous usergroup that the vehicle can no longer be viewed
        const userGroupBeforeUpdate = originalValues.UserGroup;
        if (userGroupBeforeUpdate && userGroupBeforeUpdate !== updatedRecord.UserGroup) {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('delete')
                .setContent(updatedRecord.Id)
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, userGroupBeforeUpdate, false);
        }

        // check if need to re-query nested table
        // https://github.com/sequelize/sequelize/issues/6808
        const vehicleTypeBeforeUpdate = originalValues.VehicleTypeId;
        if (vehicleTypeBeforeUpdate && vehicleTypeBeforeUpdate !== updatedRecord.VehicleTypeId) {
            updatedRecord = await queryForRecord();
        }

        if (!_.isEmpty(updatedRecord)) {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('update')
                .setContent(updatedRecord)
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, updatedRecord.UserGroup);

            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('update')
                .setContent(_.pick(updatedRecord, ['Id', 'PlateNumber', 'UserGroup']))
                .setSender(req.user)
                .emit(updatedRecord.DriverUsername);
        }
    }

    function queryForRecord() {
        // this function is required because sendWebsocket needs to re-query again
        const scopes = [req.scopes.authz, { method: ['primaryKey', id] }];
        return vrpSql.Vehicle.scope(scopes).findOne({
            include: [{
                model: vrpSql.VehicleType,
            }],
        });
    }
};
