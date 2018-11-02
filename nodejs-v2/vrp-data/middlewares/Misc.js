/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Data');

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');
const { JOB } = require('../classes');
const vrpSql = require('../../vrp-sql');
const vrpEnum = require('../../enum');
const vrpUtils = require('../../vrp-common/utils');
const vrpConfig = require('../../configuration');

exports.version = 'v2.1';

exports.m_getMinimumAppVersion = (req, res, next) => {
    req.answer = vrpConfig.get('driverApp.minVersion');
    next();
};

exports.m_checkDuplicates = (table) => {
    return async (req, res, next) => {
        log.debug('m_checkDuplicates', req.user.username);

        const ids = vrpUtils.toArray(_.get(req.body, 'ids'));

        try {
            if (_.isEmpty(ids)) {
                throw new Error('Parameter `ids` is required.');
            }

            const dbRecords = await vrpSql[table].scope({ method: ['primaryKey', ids] }).findAll({
                raw: true,
            });

            req.answer = vrpSql[table].getPrimaryKeyValues(dbRecords);

            next();
        } catch (err) {
            next(err);
        }
    };
};

exports.m_getSummary = async (req, res, next) => {
    log.debug('m_getSummary', req.user.username);

    try {
        if (_.isEmpty(req.scopes.date)) {
            throw new Error('date/startDate/endDate parameters must be specified');
        }

        const vehicleSummary = vrpSql.Vehicle.findAll({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                attributes: [],
                include: [{
                    model: vrpSql.DeliveryDetail.scope(req.scopes.date),
                    attributes: [],
                }],
            }],
            attributes: [
                [vrpSql.sequelize.col('Vehicle.Id'), 'vehicle'],
                [vrpSql.sequelize.fn('COUNT', vrpSql.sequelize.col('VehicleId')), 'count'],
                [vrpSql.sequelize.cast(vrpSql.sequelize.col('EndTimeWindow'), 'DATE'), 'date'],
            ],
            group: [vrpSql.sequelize.col('Vehicle.Id'), vrpSql.sequelize.cast(vrpSql.sequelize.col('EndTimeWindow'), 'DATE')],
            order: ['Id'],
            raw: true,
        });

        const jobSummary = vrpSql.DeliveryDetail.scope(req.scopes.date).findAll({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                attributes: [],
            }],
            attributes: [
                [vrpSql.sequelize.col('DeliveryDetail.Status'), 'status'],
                [vrpSql.sequelize.fn('COUNT', vrpSql.sequelize.col('DeliveryDetail.Id')), 'count'],
                [vrpSql.sequelize.cast(vrpSql.sequelize.col('EndTimeWindow'), 'DATE'), 'date'],
            ],
            group: [vrpSql.sequelize.col('DeliveryDetail.Status'), vrpSql.sequelize.cast(vrpSql.sequelize.col('EndTimeWindow'), 'DATE')],
            raw: true,
        });

        // vehicleSummary = [{ vehicle: '', count: '', date: '' }]
        // jobSummary = [{ status: '', count: '', date: '' }]
        const [vehicles, jobs] = await Promise.all([vehicleSummary, jobSummary]);

        const vehiclesByDate = _.groupBy(vehicles, (response) => normalizeDate(response.date));

        const formattedResult = _.chain(jobs)
            .groupBy((response) => normalizeDate(response.date))
            .map((response, date) => {
                // list of vehicles with jobs
                const assignedVehicles = _.map(vehiclesByDate[date], (vehicle) => _.omit(vehicle, 'date'));

                const numTotalJobs = _.sumBy(response, 'count');
                const numAssignedJobs = _.sumBy(assignedVehicles, 'count');
                const numUnassignedJobs = numTotalJobs - numAssignedJobs;

                const numJobsByStatus = _.map(response, (jobs) => {
                    if (jobs.status === JOB.STATUS.PENDING) {
                        // in database context, unassigned jobs are also pending
                        jobs.count = jobs.count - numUnassignedJobs;
                    }
                    return _.omit(jobs, 'date');
                });

                // add unassigned status
                numJobsByStatus.push({
                    status: 6,
                    count: numUnassignedJobs,
                });

                return {
                    date: date,
                    numJobsByStatus: numJobsByStatus,
                    numTotalJobs: numTotalJobs,
                    numAssignedJobs: numAssignedJobs,
                    numUnassignedJobs: numUnassignedJobs,
                    assignedVehicles: assignedVehicles,
                };
            })
            .value();

        req.answer = formattedResult;
        next();
    } catch (err) {
        next(err);
    }

    function normalizeDate(date) {
        return moment(date).format(vrpEnum.DateFormat.DATE);
    }
};
