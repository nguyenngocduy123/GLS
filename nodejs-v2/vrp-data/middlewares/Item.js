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

const SOCKET_TOPIC = vrpEnum.SocketTopic.ITEM;
const MAX_BULK_DELETE_COUNT = vrpConfig.get('database.sql.custom.maxDeleteCount');
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneItem', req.user.username);

    const id = req.params.itemId;

    try {
        const dbRecord = await vrpSql.Item.scope({ method: ['primaryKey', id] }).findOne();
        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllItem', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        const dbRecords = await vrpSql.Item.findAll({
            where: where,
        });
        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createItem', req.user.username);

    const record = _.get(req.body, 'record');

    try {
        validateParams();

        const insertedRecords = await insertDatabase();

        req.answer = vrpSql.Item.getPrimaryKeyValues(insertedRecords);
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(insertedRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isNil(record)) {
            throw new Error('Parameter `record` is required.');
        }
    }

    function insertDatabase() {
        return vrpSql.Item.bulkCreate(vrpSql.setCreatedBy(req, vrpUtils.toArray(record)), {
            returning: true,
        });
    }

    function sendWebsocket(insertedRecords) {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('create')
            .setContent(insertedRecords)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};

exports.m_bulkDelete = async (req, res, next) => {
    log.debug('m_bulkDeleteItem', req.user.username);

    const itemIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    try {
        validateParams();

        await checkPermission(); // check if user has permission

        const rowCount = await vrpSql.Item.scope({ method: ['primaryKey', itemIds] }).destroy();
        req.answer = rowCount;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)();
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(itemIds)) {
            throw new Error('Parameter `ids` is required.');
        } else if (itemIds.length > MAX_BULK_DELETE_COUNT) {
            throw new Error(`Maximum number of records allowed to be deleted is ${MAX_BULK_DELETE_COUNT}.`);
        }
    }

    async function checkPermission() {
        const affectedItems = await vrpSql.Item.scope({ method: ['primaryKey', itemIds] }).findAll({
            attributes: ['Id'],
            raw: true, // query for comparision only
        });

        const invalidItemIds = _.differenceBy(itemIds, _.map(affectedItems, 'Id'), _.toNumber);
        if (!_.isEmpty(invalidItemIds)) {
            throw new Error(`Either item does not exist or not enough permissions: ${_.join(invalidItemIds, ',')}`);
        }
    }

    function sendWebsocket() {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('delete')
            .setContent(itemIds)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateItem', req.user.username);

    const id = req.params.itemId;
    const newValues = _.get(req.body, 'newValues', {});

    try {
        validateParams();

        const dbRecord = await checkPermission(); // check if user has permission

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
        const newValuesId = newValues[vrpSql.Item.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        }
    }

    async function checkPermission() {
        const affectedItem = await vrpSql.Item.scope({ method: ['primaryKey', id] }).findOne();

        if (_.isEmpty(affectedItem)) {
            throw new Error(`Either item does not exist or not enough permissions: ${id}`);
        }
        return affectedItem;
    }

    function sendWebsocket(updatedRecord) {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent(updatedRecord)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER);
    }
};
