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
const vrpUserUtils = require('../../vrp-user/user-utils');

exports.version = 'v2.1';

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneDeliveryPODByDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        let dbRecord;
        if (vrpUserUtils.isPlanner(req.user)) {
            dbRecord = await vrpSql.DeliveryPOD.findOne({
                where: {
                    DeliveryDetailId: id,
                },
                include: [{
                    model: vrpSql.DeliveryDetail,
                    attributes: [],
                    include: [{
                        model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                        attributes: [],
                    }],
                }],
            });
        } else if (vrpUserUtils.isDriver(req.user)) {
            dbRecord = await vrpSql.DeliveryPOD.findOne({
                where: {
                    DeliveryDetailId: id,
                },
                include: [{
                    required: true, // necessary for nested where query to work
                    model: vrpSql.DeliveryDetail,
                    attributes: [],
                    include: [{
                        required: true, // necessary for nested where query to work
                        model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                        attributes: [],
                        include: [{
                            required: true, // necessary for nested where query to work
                            model: vrpSql.Vehicle,
                            attributes: [],
                            where: {
                                DriverUsername: req.user.username,
                            },
                        }],
                    }],
                }],
            });
        }

        if (!_.isEmpty(dbRecord)) {
            dbRecord.Signature = vrpUtils.bufferToBase64(dbRecord.Signature);
            dbRecord.Photo = vrpUtils.bufferToBase64(dbRecord.Photo);
        }

        req.answer = dbRecord;
        next();
    } catch (err) {
        next(err);
    }
};
