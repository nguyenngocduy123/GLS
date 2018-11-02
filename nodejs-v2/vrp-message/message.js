/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Message');

const _ = require('lodash');
const moment = require('moment');
const vrpEnum = require('../enum');
const vrpMongo = require('../vrp-common/mongo');
const vrpUtils = require('../vrp-common/utils');
const { VrpSocketMessage } = require('../vrp-common/socket');

let colMessage; // variables to access mongo collections
let colUser;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colMessage = await vrpMongo.getCollection(mongoDb, 'message');
    colUser = await vrpMongo.getCollection(mongoDb, 'user');
});

exports.m_userGroupFilter = (req, res, next) => {
    req.filter = req.filter || {};

    const usergroup = _.get(req, 'user.usergroup');
    if (usergroup) {
        Object.assign(req.filter, { 'job.UserGroup': _.toUpper(usergroup) });
    }
    next();
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getMyMessages', req.query);

    const startDate = _.get(req.query, 'startDate');
    const endDate = _.get(req.query, 'endDate');

    try {
        if (startDate && !moment(startDate, moment.ISO_8601).isValid()) {
            throw new Error('`startDate` must be in valid ISO8601 format.');

        } else if (endDate && !moment(endDate, moment.ISO_8601).isValid()) {
            throw new Error('`endDate` must be in valid ISO8601 format.');

        } else if (startDate && endDate && !moment(startDate).isBefore(moment(endDate))) {
            throw new Error('`startDate` must be earlier than `endDate`.');
        }

        const filter = Object.assign({ toUserRoles: req.user.role }, req.filter);

        // set filter with date range
        if (startDate) {
            _.set(filter, 'modified_date.$gte', moment(startDate).startOf('day').toDate()); // set to 12:00 am
        }
        if (endDate) {
            _.set(filter, 'modified_date.$lte', moment(endDate).endOf('day').toDate()); // set to 23:59 pm
        }

        const messages = await colMessage.find(filter).toArray();

        req.answer = messages;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getTotalUnprocessedCount = async (req, res, next) => {
    log.debug('m_getTotalUnprocessedCount');

    try {
        const filter = Object.assign({
            toUserRoles: req.user.role,
            processedByUsername: { $eq: null },
        }, req.filter);

        const numMessages = await colMessage.countDocuments(filter);

        req.answer = numMessages;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_processMessage = async (req, res, next) => {
    log.debug('m_processMessage', req.params.id);

    const id = _.get(req.params, 'id');

    try {
        const result = await colMessage.findOneAndUpdate({
            _id: vrpMongo.getObjectId(id),
        }, {
            $set: {
                processedByUsername: req.user.username,
                processedAt: new Date(),
                modified_date: new Date(),
            },
        }, {
            upsert: false,
            returnOriginal: false,
        });

        req.answer = _.get(result, 'value');

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_createMessages = async (req, res, next) => {
    log.debug('m_createMessages', req.body);

    const jobs = vrpUtils.toArray(_.get(req.body, 'jobs'));
    const driverRemarks = _.get(req.body, 'driverRemarks');
    const lateBy = _.get(req.body, 'lateBy');

    try {
        if (_.isEmpty(jobs)) {
            throw new Error('jobs are required');

        } else if (_.isEmpty(lateBy)) {
            throw new Error('late by is required');

        } else if (_.size(_.uniqBy(jobs, 'Id')) !== jobs.length) {
            throw new Error('jobs cannot have duplicates of the same Id');
        }

        const messages = _.map(jobs, (job) => ({
            lateBy,
            driverRemarks,
            job,
            toUserRoles: [vrpEnum.UserRole.PLANNER], // for now, only planner can receive messages
            fromUsername: req.user.username,
            processedAt: null,
            processedByUsername: null,
            created_date: new Date(),
            modified_date: new Date(),
        }));

        log.trace('m_createMultiMessages -> messages', messages);

        const bulk = colMessage.initializeUnorderedBulkOp();

        _.each(messages, (message) => {
            bulk.find({ 'job.Id': message.job.Id }).upsert().updateOne(message);
        });

        const result = await bulk.execute();
        log.trace(`Save ${result.nUpserted + result.nModified} messages to database`);

        req.answer = messages;
        next();
    } catch (err) {
        next(err);
    }
};

/**
 * Attach users to each message in req.answer
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_addUserDetails = async (req, res, next) => {
    const messages = vrpUtils.toArray(req.answer);

    try {
        if (messages) {
            // consolidate lists of usernames (sender + processor)
            const usernames = _.reduce(messages, (list, message) => {
                if (message.fromUsername && !_.includes(list, message.fromUsername)) {
                    list.push(message.fromUsername);
                }
                if (message.processedByUsername && !_.includes(list, message.processedByUsername)) {
                    list.push(message.processedByUsername);
                }
                return list;
            }, []);

            const foundUsers = await colUser.find({
                username: { $in: _.map(usernames, vrpMongo.toCaseInsensitiveRegex) },
            }, {
                projection: { _id: 0, username: 1, fullname: 1, phone: 1 },
            }).toArray();

            _.each(messages, (message) => {
                message.fromUser = _.find(foundUsers, (user) => vrpUtils.isSameText(user.username, message.fromUsername));
                message.processedBy = _.find(foundUsers, (user) => vrpUtils.isSameText(user.username, message.processedByUsername));
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_broadcastWSToPlanner = (req, res, next) => {
    // second args assumes send to super users only
    _.each(_.groupBy(vrpUtils.toArray(req.answer), 'job.UserGroup'), (message, usergroup) => {
        new VrpSocketMessage(vrpEnum.SocketTopic.MESSAGE)
            .setPurpose('update')
            .setContent(message)
            .setSender(req.user)
            .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
    });
    next();
};
