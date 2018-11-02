/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('UserGroup');

const _ = require('lodash');
const vrpMongo = require('../vrp-common/mongo');
const vrpUtils = require('../vrp-common/utils');

let colUserGroup;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colUserGroup = await vrpMongo.getCollection(mongoDb, 'usergroup');
});

exports.m_get = async (req, res, next) => {
    const usergroups = _.get(req.query, 'usergroups');
    const projection = _.get(req.query, 'projection');

    try {
        log.debug('m_getUserGroups', req.query);

        const filter = {};
        if (usergroups) {
            filter.usergroup = {
                $in: _.map(_.split(usergroups, ','), vrpMongo.toCaseInsensitiveRegex),
            };
        }

        const project = { _id: true, usergroup: true, modified_date: true };
        if (projection) {
            _.each(_.split(projection, ','), (key) => { project[key] = true; });
        }

        const result = await colUserGroup.find(filter, { projection: project }).sort({ usergroup: 1 }).toArray();

        req.answer = result;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    const usergroups = vrpUtils.toArray(req.body);

    try {
        log.debug('m_createUserGroups', usergroups);

        if (_.isEmpty(usergroups)) {
            throw new Error('You must specify usergroups');
        } else if (_.find(usergroups, (group) => !_.isString(group.usergroup))) {
            throw new Error('usergroup must be in string');
        } else if (_.size(_.uniqBy(usergroups, 'usergroup')) !== usergroups.length) {
            throw new Error('usergroup must be unique');
        }

        const result = await colUserGroup.insertMany(_.map(usergroups, (group) => ({
            usergroup: _.toUpper(group.usergroup),
            description: group.description,
            modified_date: new Date(),
        })));

        req.answer = result.ops;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_delete = async (req, res, next) => {
    const usergroups = _.get(req.query, 'usergroups');

    try {
        const usergroupNames = (usergroups) ? _.split(usergroups, ',') : [];

        if (usergroupNames.length === 0) {
            throw new Error('You must specify usergroups');
        }

        log.debug('m_deleteUserGroups', _.get(req, 'user.username'), usergroupNames);

        const result = await colUserGroup.deleteMany({
            usergroup: {
                $in: _.map(usergroupNames, vrpMongo.toCaseInsensitiveRegex),
            },
        });

        req.answer = result.deletedCount;

        next();
    } catch (err) {
        next(err);
    }
};
