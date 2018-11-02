/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Scopes');

const _ = require('lodash');
const moment = require('moment');

/**
 * Middleware to generate date scopes for database requests based on the date(s) specified
 * in the query string
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_addDate = (req, res, next) => {
    log.debug('m_addDate');
    const startDate = _.get(req.query, 'startDate');
    const endDate = _.get(req.query, 'endDate');
    const date = _.get(req.query, 'date');

    req.scopes = initScope(req.scopes);
    if (_.isNil(startDate) !== _.isNil(endDate)) {
        return next('`startDate` must be specified with `endDate`.');
    } else if (!_.isNil(startDate) && !_.isNil(endDate)) {
        if (!moment(startDate, moment.ISO_8601).isValid()) {
            return next(new Error('`startDate` must be in valid ISO8601 format.'));
        } else if (!moment(endDate, moment.ISO_8601).isValid()) {
            return next(new Error('`endDate` must be in valid ISO8601 format.'));
        } else if (!(moment(startDate).isSame(moment(endDate), 'day') || moment(startDate).isBefore(moment(endDate)))) {
            return next(new Error('`startDate` must be earlier than `endDate`.'));
        } else {
            req.scopes.date = {
                method: ['date', moment(startDate), moment(endDate)],
            };
        }
    } else if (!_.isNil(date)) {
        if (!moment(date, moment.ISO_8601).isValid()) {
            return next(new Error('`date` must be in valid ISO8601 format.'));
        } else {
            req.scopes.date = {
                method: ['date', moment(date)],
            };
        }
    }

    log.debug('Add `date` scope', req.scopes);
    next();
};

/**
 * Middleware to generate authorisation scopes for database requests based on the logged-in
 * user's UserGroup. If the logged-in user does not have UserGroup, it means that the user
 * is a superuser who can see all data.
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_addAuthz = (req, res, next) => {
    req.scopes = initScope(req.scopes);

    if (_.isEmpty(req.user)) {
        return next(new Error('Forbidden: User is not logged in.'));
    }

    req.scopes.authz = { method: ['restrictTo', _.get(req, 'user.usergroup', null)] };

    log.debug('Add `restrictTo` scope', req.scopes);
    next();
};

/**
 * Returns initial value of `req.scopes`. If `scope` already exists, it will return as it is.
 *
 * @param {Object} scope  `req.scopes` value
 * @returns {Object}  todo
 */
function initScope(scope) {
    if (_.isEmpty(scope)) {
        // list of scopes supported by the APIs
        return {
            date: undefined,
            authz: undefined,
        };
    } else {
        return scope;
    }
}
