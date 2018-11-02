/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');

/**
 * Function to ensure the room name generated for `usergroup` is consistent
 * @param {String} role  User role
 * @param {String} usergroup   User usergroup
 * @returns {String}  Room name for specified `usergroup`
 */
exports.getUserGroupRoomName = (role, usergroup) => {
    if (this.checkIfSuperUserGroup(usergroup)) {
        usergroup = '*';
    }
    return `usergroup.${_.toLower(role)}.${_.toLower(usergroup)}`;
};

exports.isUserRoleRoomName = (roomName, role) => {
    return _.startsWith(roomName, `usergroup.${_.toLower(role)}.`);
};

/**
 * Function to ensure the room name generated for `username` is consistent
 * @param {String} username   User username
 * @returns {String}  Room name for specified `username`
 */
exports.getUsernameRoomName = (username) => {
    return `username.${_.toLower(username)}`;
};

/**
 * Check if usergroup is a super usergroup
 * @param {String} usergroup   User usergroup
 * @returns {Boolean} `true` if usergroup is empty (i.e. super user)
 */
exports.checkIfSuperUserGroup = (usergroup) => {
    return _.isEmpty(usergroup) || usergroup === 'null' || usergroup === 'undefined';
};

/**
 * Check if usergroup is a super usergroup
 * @param {String} usergroup   User usergroup
 * @returns {Boolean} `true` if usergroup is empty (i.e. super user)
 */
exports.checkIfSuperUserGroup = (usergroup) => {
    return _.isEmpty(usergroup) || usergroup === 'null' || usergroup === 'undefined';
};
