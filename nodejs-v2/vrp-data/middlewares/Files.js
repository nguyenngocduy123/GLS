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
const files = require('../utils/files');

exports.version = 'v2.1';

exports.m_transactionLog = async (req, res, next) => {
    log.debug('m_generateTransactionLog', req.user.username);

    const downloadWithPhotos = vrpUtils.toBoolean(_.get(req.query, 'withPhotos', false));

    try {
        const bufferContent = await files.transactionLog(req.scopes, downloadWithPhotos);
        if (_.isNil(bufferContent)) {
            throw new Error('Unable to generate file.');
        }

        res.writeHead(200, { 'Content-Type': 'application/zip' });
        res.end(Buffer.from(bufferContent, 'base64'));
    } catch (err) {
        next(err);
    }
};

exports.m_serviceChit = async (req, res, next) => {
    log.debug('m_generateServiceChit', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        const dbRecord = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
            }, {
                model: vrpSql.DeliveryPOD,
            }],
        });

        if (_.isEmpty(dbRecord)) {
            throw new Error('Invalid order');
        }

        const signature = _.get(dbRecord, 'DeliveryPOD.Signature');
        // sequelize instance is immutable, so needs to convert to JSON first to use omit
        const job = _.omit(dbRecord.toJSON(), ['DeliveryMaster', 'DeliveryPOD']);
        const bufferContent = await files.serviceChit(job, signature);
        if (_.isEmpty(bufferContent)) {
            throw new Error('Unable to generate file (empty buffer content).');
        }

        res.writeHead(200, { 'Content-Type': 'application/pdf' });
        res.end(Buffer.from(bufferContent, 'base64'));
    } catch (err) {
        next(err);
    }
};

exports.m_dataTemplate = (req, res) => {
    log.debug('m_downloadDataTemplateV2', req.user.username);
    res.download(files.importTemplate());
};
