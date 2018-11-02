/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const vrpEnum = require('../enum');
const vrpUser = require('../vrp-user/user');
const vrpUserGroup = require('./user-group');
const vrpUtils = require('../vrp-common/utils');

/**
 * Check if a user belongs to a particular role.
 * `user` can be taken from `req.user` in passport.
 *
 * @param {object} user  todo
 * @param {object} user.role  todo
 * @example isPlanner(req.user)
 * @example isPlanner({ role: 'planner' })
 * @returns {Promise<boolean>}  todo
 */
exports.isAdmin = (user) => vrpUtils.isSameText(_.get(user, 'role'), vrpEnum.UserRole.ADMIN);
exports.isPlanner = (user) => vrpUtils.isSameText(_.get(user, 'role'), vrpEnum.UserRole.PLANNER);
exports.isDriver = (user) => vrpUtils.isSameText(_.get(user, 'role'), vrpEnum.UserRole.DRIVER);
exports.isDefault = (user) => vrpUtils.isSameText(_.get(user, 'role'), vrpEnum.UserRole.DEFAULT);
exports.isController = (user) => vrpUtils.isSameText(_.get(user, 'role'), vrpEnum.UserRole.CONTROLLER);
exports.isValidRole = (role) => this.isAdmin({ role: role }) ||this.isPlanner({ role: role }) || this.isDriver({ role: role }) || this.isDefault({ role: role }) || this.isController({ role: role });
 
/**
 * Check if (one) driver's username exists in the system.
 *
 * @param {String[]} usernames  todo
 * @returns {Promise<boolean>}  todo
 */
exports.checkIfValidDrivers = (usernames) => {
    const req = {
        query: {
            usernames: _.map(_.concat(usernames), _.toLower),
            roles: vrpEnum.UserRole.DRIVER,
        },
    };

    return new Promise((resolve, reject) => {
        vrpUser.m_getUsers(req, null, (err) => {
            const usernames = _.get(req.query, 'usernames');

            if (!_.isNil(err)) {
                reject(err);
            } else {
                const validUsernames = _.reduce(req.answer, (list, user) => {
                    if (!user.disabled) {
                        list.push(_.toLower(user.username));
                    }
                    return list;
                }, []);

                const invalidUsernames = _.difference(usernames, validUsernames);
                resolve(_.compact(invalidUsernames));
            }
        });
    });
};

exports.checkUserGroupsExist = (usergroups) => {
    const req = {
        query: {
            usergroups: _.map(_.concat(usergroups), _.toLower),
        },
    };

    return new Promise((resolve, reject) => {
        vrpUserGroup.m_get(req, null, (err) => {
            const usergroups = _.get(req.query, 'usergroups');

            if (!_.isNil(err)) {
                reject(err);
            } else {
                const validUsergroups = _.map(req.answer, (group) => _.toLower(group.usergroup));
                const invalidUsergroups = _.difference(usergroups, validUsergroups);
                resolve(_.compact(invalidUsergroups));
            }
        });
    });
};
