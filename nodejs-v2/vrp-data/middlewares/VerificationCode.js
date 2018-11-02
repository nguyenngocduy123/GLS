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
const mail = require('../utils/mail');
const vrpEnum = require('../../enum');
const vrpUtils = require('../../vrp-common/utils');
const { VrpSocketMessage } = require('../../vrp-common/socket');

const SOCKET_TOPIC = vrpEnum.SocketTopic.JOB;
exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getVerificationCode', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        const dbRecord = await vrpSql.VerificationCode.scope({ method: ['primaryKey', id] }).findOne();
        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_delete = async (req, res, next) => {
    log.debug('m_deleteVerificationCode', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        // verification code delete API does not throw error even if record does not exist
        const dbRecord = await getRecord();
        req.answer = 0;

        if (dbRecord) {
            await dbRecord.destroy();
            req.answer = 1;
        }

        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecord);
        }
    } catch (err) {
        next(err);
    }

    async function getRecord() {
        const affectedCode = await vrpSql.VerificationCode.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryDetail,
                include: {
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    include: [{
                        model: vrpSql.Vehicle,
                    }],
                },
            }],
        });
        return affectedCode;
    }

    function sendWebsocket(updatedRecord) {
        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent({
                Id: _.get(updatedRecord, 'DeliveryDetailId'),
                VerificationCode: null,
            })
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(updatedRecord, 'DeliveryDetail.DeliveryMaster.UserGroup'));
        message.emit(_.get(updatedRecord, 'DeliveryDetail.DeliveryMaster.Vehicle.DriverUsername'));
    }
};

exports.m_upsert = async (req, res, next) => {
    log.debug('m_upsertVerificationCode', req.user.username);

    const id = req.params.deliveryDetailId;
    const newValues = _.get(req.body, 'newValues', {});

    try {
        validateParams();

        await checkPermission(); // check if user has permission

        const record = Object.assign({}, newValues, { DeliveryDetailId: id });
        const upsertRecord = await vrpSql.VerificationCode.insertOrUpdate(vrpSql.setModifiedBy(req, record), {
            returning: true,
        });

        req.answer = (_.isEmpty(upsertRecord)) ? 0 : 1;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)();
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        const newValuesId = newValues[vrpSql.VerificationCode.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        }
    }

    async function checkPermission() {
        const affectedJob = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: [{
                    model: vrpSql.Vehicle,
                }],
            }],
        });

        if (_.isEmpty(affectedJob)) {
            throw new Error(`Either job does not exist or not enough permissions: ${_.join(id, ',')}`);
        }
    }

    async function sendWebsocket() {
        const dbRecord = await vrpSql.VerificationCode.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryDetail,
                include: [{
                    model: vrpSql.DeliveryMaster,
                    include: [{
                        model: vrpSql.Vehicle,
                    }],
                }],
            }],
        });

        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent({
                Id: _.get(dbRecord, 'DeliveryDetailId'),
                VerificationCode: {
                    Code: _.get(dbRecord, 'Code'),
                },
            })
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(dbRecord, 'DeliveryDetail.DeliveryMaster.UserGroup'));
        message.emit(_.get(dbRecord, 'DeliveryDetail.DeliveryMaster.Vehicle.DriverUsername'));
    }
};

exports.m_send = async (req, res, next) => {
    log.debug('m_sendVerificationCode', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        await mail.verificationCode(id);
        req.status = 204;
        next();
    } catch (err) {
        next(err);
    }
};
