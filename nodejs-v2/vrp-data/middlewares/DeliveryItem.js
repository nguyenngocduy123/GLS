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
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.JOB_ITEM;
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneDeliveryItem', req.user.username);

    const id = req.params.deliveryItemId;

    try {
        const dbRecord = await vrpSql.DeliveryItem.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.Item,
            }, {
                model: vrpSql.DeliveryDetail,
                attributes: [],
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    attributes: [],
                }],
            }],
        });

        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllDeliveryItem', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        const dbRecords = await vrpSql.DeliveryItem.findAll({
            where: where,
            include: [{
                model: vrpSql.Item,
            }, {
                model: vrpSql.DeliveryDetail,
                attributes: [],
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    attributes: [],
                }],
            }],
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createDeliveryItem', req.user.username);

    const id = req.params.deliveryDetailId;
    const originalRecord = _.get(req.body, 'record');

    // set all records DeliveryDetailId based on the one given in url params
    const records = _.map(vrpUtils.toArray(originalRecord), (job) => Object.assign(job, { DeliveryDetailId: id }));

    try {
        validateParams();

        await checkPermission(); // check if job exists and if user has permission

        const insertedRecords = await insertDatabase();

        req.answer = vrpSql.DeliveryItem.getPrimaryKeyValues(insertedRecords);
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(req.answer);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isNil(id)) {
            throw new Error('Parameter `id` is required.');
        } else if (_.isEmpty(records)) {
            throw new Error('Parameter `record` is required.');
        } else if (vrpSql.DeliveryItem.hasPrimaryKeyValues(records)) {
            throw new Error('Primary key of the records must not be specified.');
        }
    }

    async function checkPermission() {
        const affectedJob = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
            }],
        });

        if (_.isEmpty(affectedJob)) {
            throw new Error('Either job does not exist or you do not have enough permission.');
        }
    }

    function insertDatabase() {
        return vrpSql.DeliveryItem.bulkCreate(vrpSql.setCreatedBy(req, records), {
            returning: true,
        });
    }

    async function sendWebsocket(insertedIds) {
        // need to query database to get eager loaded information
        const dbRecords = await vrpSql.DeliveryItem.scope({ method: ['primaryKey', insertedIds] }).findAll({
            include: [{
                model: vrpSql.DeliveryDetail,
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    include: {
                        model: vrpSql.Vehicle,
                    },
                }],
            }],
        });

        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('create')
            // sequelize instance is immutable, so needs to convert to JSON first to use omit
            .setContent(_.map(dbRecords, (deliveryItem) => _.omit(deliveryItem.toJSON(), 'DeliveryDetail')))
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(dbRecords, '[0].DeliveryDetail.DeliveryMaster.UserGroup'));
        message.emit(_.get(dbRecords, '[0].DeliveryDetail.DeliveryMaster.Vehicle.DriverUsername'));
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateDeliveryItem', req.user.username);

    const id = req.params.deliveryItemId;
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
        const newValuesId = newValues[vrpSql.DeliveryItem.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        }
    }

    async function checkPermission() {
        const affectedJobItem = await vrpSql.DeliveryItem.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryDetail,
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    include: [{
                        model: vrpSql.Vehicle,
                    }],
                }],
            }],
        });

        if (_.isEmpty(affectedJobItem)) {
            throw new Error(`Either job item does not exist or not enough permissions: ${id}`);
        } else if ((newValues.DeliveryDetailId !== undefined) && !vrpUtils.isSameText(affectedJobItem.DeliveryDetailId, newValues.DeliveryDetailId)) {
            throw new Error('DeliveryDetailId cannot be modified. Create a new job item instead');
        }
        return affectedJobItem;
    }

    function sendWebsocket(updatedRecord) {
        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent(updatedRecord)
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(updatedRecord, 'DeliveryDetail.DeliveryMaster.UserGroup'));
        message.emit(_.get(updatedRecord, 'DeliveryDetail.DeliveryMaster.Vehicle.DriverUsername'));
    }
};

exports.m_getByDeliveryDetail = async (req, res, next) => {
    log.debug('m_getDeliveryItemByDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        const dbRecords = await vrpSql.DeliveryItem.findAll({
            where: {
                DeliveryDetailId: id,
            },
            include: [{
                model: vrpSql.Item,
            }, {
                model: vrpSql.DeliveryDetail,
                attributes: [],
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    attributes: [],
                }],
            }],
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_replaceByDeliveryDetail = async (req, res, next) => {
    log.debug('m_replaceDeliveryItemByDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;
    const originalRecord = _.get(req.body, 'record');

    // set all records DeliveryDetailId based on the one given in url params
    const records = _.map(vrpUtils.toArray(originalRecord), (job) => Object.assign(job, { DeliveryDetailId: id }));

    try {
        validateParams();

        await checkPermission(); // check if job exists and if user has permission

        req.answer = await replaceDatabase(records);
        next();

        // check if rowCount is > 0 or has new inserted records
        if (_.size(_.compact(req.answer)) > 0) {
            vrpUtils.silenceError(sendWebsocket)();
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isNil(id)) {
            throw new Error('Parameter `id` is required.');
        } else if (_.isEmpty(records)) {
            throw new Error('Parameter `record` is required.');
        } else if (vrpSql.DeliveryItem.hasPrimaryKeyValues(records)) {
            throw new Error('Primary key of the records must not be specified.');
        }
    }

    async function checkPermission() {
        const affectedJob = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: {
                    model: vrpSql.Vehicle,
                },
            }, {
                model: vrpSql.DeliveryItem,
            }],
        });

        if (_.isEmpty(affectedJob)) {
            throw new Error(`Either job does not exist or you do not have enough permission: ${id}`);
        } else {
            return affectedJob;
        }
    }

    async function replaceDatabase(records) {
        let transaction;
        try {
            transaction = await vrpSql.sequelize.transaction();

            // remove existing records from database
            const rowCount = await vrpSql.DeliveryItem.destroy({
                where: {
                    DeliveryDetailId: id,
                },
                transaction: transaction,
            });

            // create new delivery items
            const dbRecords = await vrpSql.DeliveryItem.bulkCreate(vrpSql.setCreatedBy(req, records), {
                returning: true,
                transaction: transaction,
            });

            await transaction.commit();

            return [rowCount, vrpSql.DeliveryItem.getPrimaryKeyValues(dbRecords)];
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    async function sendWebsocket() {
        // need to query database to get eager loaded information
        const dbRecords = await vrpSql.DeliveryItem.findAll({
            where: {
                DeliveryDetailId: id,
            },
            include: [{
                model: vrpSql.DeliveryDetail,
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    include: {
                        model: vrpSql.Vehicle,
                    },
                }],
            }],
        });

        const message = new VrpSocketMessage(vrpEnum.SocketTopic.JOB)
            .setPurpose('update')
            .setContent({
                Id: id,
                // sequelize instance is immutable, so needs to convert to JSON first to use omit
                DeliveryItems: _.map(dbRecords, (deliveryItem) => _.omit(deliveryItem.toJSON(), 'DeliveryDetail')),
            })
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(dbRecords, '[0].DeliveryDetail.DeliveryMaster.UserGroup'));
        message.emit(_.get(dbRecords, '[0].DeliveryDetail.DeliveryMaster.Vehicle.DriverUsername'));
    }
};
