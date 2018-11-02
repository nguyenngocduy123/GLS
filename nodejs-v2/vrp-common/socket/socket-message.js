/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Socket');

const _ = require('lodash');
const vrpUtils = require('../../vrp-common/utils');
const vrpSocket = require('./socket');
const vrpSocketUtils = require('./socket-utils');
const vrpEnum = require('../../enum');

module.exports = class SocketMsg {
    constructor(topic) {
        // topic vrpEnum.SocketTopic
        this.topic = topic || vrpEnum.SocketTopic.DEFAULT;
        this.message = {};
    }

    setPurpose(purpose) {
        this.message.purpose = _.toLower(purpose);
        return this;
    }

    setContent(data) {
        this.message.data = vrpUtils.toArray(data);
        return this;
    }

    setSender(user) {
        this.message.from = _.get(user, 'fullname') || _.get(user, 'username') || user;
        return this;
    }

    /**
     * Send message to logged-in/connected user that is `username`.
     * @param {String|string[]} usernames  List of usernames to send message to
     * @returns {void}
     */
    emit(usernames) {
        usernames = vrpUtils.toArray(usernames);

        _.each(_.uniq(usernames), (username) => {
            const room = vrpSocketUtils.getUsernameRoomName(username);
            vrpSocket.broadcastToRoom(room, this.message, this.topic);
        });
    }

    broadcast(role, usergroups, toSuperUsers = true) {
        // role vrpEnum.UserRole
        log.debug('Online users', vrpSocket.getOnlineUsers());
        log.debug('Existing rooms', vrpSocket.getOnlineRooms());

        usergroups = _.uniq(_.concat(usergroups)); // do not remove null values because message can be for super users only

        if (_.isEmpty(usergroups)) {
            // broadcast to all users of the same role
            _.each(vrpSocket.getOnlineRooms(), (room) => {
                if (vrpSocketUtils.isUserRoleRoomName(room, role)) {
                    vrpSocket.broadcastToRoom(room, this.message, this.topic);
                }
            });

        } else {
            // send message to users in specific usergroups
            _.each(usergroups, (usergroup) => {
                // check if need to notify super users
                if (vrpSocketUtils.checkIfSuperUserGroup(usergroup) && toSuperUsers === false) {
                    return;
                }

                const room = vrpSocketUtils.getUserGroupRoomName(role, usergroup);
                vrpSocket.broadcastToRoom(room, this.message, this.topic);
            });
        }
    }
};
