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

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllDeliveryNoteByDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;

    let dbRecords;
    try {
        if (vrpUserUtils.isPlanner(req.user)) {
            dbRecords = await vrpSql.DeliveryNote.findAll({
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
            // driver can only view notes for his own jobs
            dbRecords = await vrpSql.DeliveryNote.findAll({
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

        req.answer = _.map(dbRecords, (note) => vrpUtils.bufferToBase64(note.Photo));
        next();
    } catch (err) {
        next(err);
    }
};
