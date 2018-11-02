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
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.VEHICLE_TYPE;
const MAX_BULK_DELETE_COUNT = vrpConfig.get('database.sql.custom.maxDeleteCount');
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneVehicleType', req.user.username);

    const id = req.params.vehicleTypeId;

    try {
        const dbRecord = await vrpSql.VehicleType.scope({ method: ['primaryKey', id] }).findOne();
        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllVehicleType', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        const dbRecords = await vrpSql.VehicleType.findAll({
            where: where,
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createVehicleType', req.user.username);

    const records = vrpUtils.toArray(_.get(req.body, 'record'));

    try {
        validateParams();

        const insertedRecords = await insertDatabase();
        req.answer = vrpSql.VehicleType.getPrimaryKeyValues(insertedRecords);
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
        } else if (vrpSql.VehicleType.hasPrimaryKeyValues(records)) {
            throw new Error('Primary key of the records must not be specified.');
        }
    }

    function insertDatabase() {
        return vrpSql.VehicleType.bulkCreate(vrpSql.setCreatedBy(req, records), {
            returning: true,
        });
    }

    function sendWebsocket(insertedRecord) {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('create')
            .setContent(insertedRecord)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};

exports.m_bulkDelete = async (req, res, next) => {
    log.debug('m_bulkDeleteVehicleType', req.user.username);

    const vehicleTypeIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    try {
        validateParams();

        await checkPermission(); // check if user has permission

        const rowCount = await vrpSql.VehicleType.scope({ method: ['primaryKey', vehicleTypeIds] }).destroy();
        req.answer = rowCount;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)();
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(vehicleTypeIds)) {
            throw new Error('Parameter `ids` is required.');
        } else if (vehicleTypeIds.length > MAX_BULK_DELETE_COUNT) {
            throw new Error(`Maximum number of records allowed to be deleted is ${MAX_BULK_DELETE_COUNT}.`);
        }
    }

    async function checkPermission() {
        const affectedVehicleTypes = await vrpSql.VehicleType.scope({ method: ['primaryKey', vehicleTypeIds] }).findAll({
            attributes: ['Id'],
            raw: true, // query for comparision only
        });

        const invalidVehicleTypeIds = _.differenceBy(vehicleTypeIds, _.map(affectedVehicleTypes, 'Id'), _.toNumber);
        if (!_.isEmpty(invalidVehicleTypeIds)) {
            throw new Error(`Either vehicle does not exist or not enough permissions: ${_.join(invalidVehicleTypeIds, ',')}`);
        }
    }

    function sendWebsocket() {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('delete')
            .setContent(vehicleTypeIds)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateVehicleType', req.user.username);

    const id = req.params.vehicleTypeId;
    const newValues = _.get(req.body, 'newValues', {});

    try {
        validateParams();

        const dbRecord = await checkPermission();

        await dbRecord.update(vrpSql.setModifiedBy(req, newValues));
        req.answer = 1;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecord);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        const newValuesId = newValues[vrpSql.VehicleType.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        }
    }

    async function checkPermission() {
        const affectedVehicleType = await vrpSql.VehicleType.scope({ method: ['primaryKey', id] }).findOne();

        if (_.isEmpty(affectedVehicleType)) {
            throw new Error(`Either vehicle type does not exist or not enough permissions: ${id}`);
        }
        return affectedVehicleType;
    }

    function sendWebsocket(updatedRecord) {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent(updatedRecord)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};
