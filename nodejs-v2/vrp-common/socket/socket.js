/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Socket');

const _ = require('lodash');
const socketIo = require('socket.io');
const vrpUtils = require('../../vrp-common/utils');
const vrpSocketUtils = require('./socket-utils');
const vrpPassportUtils = require('../../vrp-user/passport-utils');

module.exports = this;

this.io = null;

/**
 * Sets-up websocket server. Should only be called once during the application lifetime.
 * @param {Object} server  http.Server
 * @param {Function<req,res,next>} sessionMiddleware  Middleware that handles user sessions
 * @returns {void}
 */
this.setup = (server, sessionMiddleware) => {
    this.io = socketIo(server, {
        origins: '*:*',
        transports: ['websocket', 'flashsocket', 'polling'],
    });

    // middleware to populate req.user
    this.io.use((client, next) => {
        // get query string from socket url
        client.request.query = _.clone(client.handshake.query);
        // get user information from session if exists
        sessionMiddleware(client.request, {}, (err) => {
            const user = _.get(client, 'request.session.passport.user');
            _.set(client, 'request.user', user);
            next(err);
        });
    });

    // middleware to get user information
    this.io.use((client, next) => {
        // check if user is valid
        vrpPassportUtils.isLoggedIn((err) => {
            const user = _.get(client, 'request.user');
            if (err) {
                log.debug('NOT CONNECTED', err);
                next(err);

            } else if (!user || !_.has(user, 'username') || !_.has(user, 'usergroup') || !_.has(user, 'role')) {
                log.debug('NOT CONNECTED, invalid user', user);
                next('Invalid user');

            } else {
                client.userCredentials = _.mapValues(user, _.toLower);
                log.debug(`CONNECTED ${client.userCredentials.username}`);
                next();
            }
        })(client.request);
    });

    // event handler after user is authenticated
    this.io.on('connection', (client) => {
        const username = _.get(client.userCredentials, 'username');
        const usergroup = _.get(client.userCredentials, 'usergroup');
        const role = _.get(client.userCredentials, 'role');

        // join a room based on usergroup
        const groupRoom = vrpSocketUtils.getUserGroupRoomName(role, usergroup);
        log.debug(`ROOM: add user '${username}' to room '${groupRoom}'`);
        client.join(groupRoom);

        // join a room based on username
        const userRoom = vrpSocketUtils.getUsernameRoomName(username);
        log.debug(`ROOM: add user '${username}' to room '${userRoom}'`);
        client.join(userRoom);

        client.on('disconnect', () => {
            log.debug('Online users', this.getOnlineUsers());
            log.debug('Existing rooms', this.getOnlineRooms());
        });
    });

    this.io.on('error', (err) => {
        log.error('ERROR:', err);
    });
};

/**
 * Force disconnect any connected users.
 * @param {String[]} usernames  List of usernames
 * @returns {void}
 */
this.forceDisconnect = (usernames) => {
    _.each(vrpUtils.toArray(usernames), (username) => {
        const userRoom = vrpSocketUtils.getUsernameRoomName(username);

        log.debug(`ROOM: attempting to disconnect user '${username}'`);

        // get list of sockets connected to the username room
        const socketList = this.io.sockets.adapter.rooms[userRoom];

        if (socketList) {
            // force disconnect every socket
            _.each(socketList.sockets, (connected, socketId) => {
                this.io.sockets.sockets[socketId].disconnect();
            });
        }
    });
};

/**
 * Get list of connected sockets (i.e. online users)
 * @returns {void}
 */
this.getOnlineUsers = () => {
    const users = [];
    _.each(this.getOnlineRooms(), (room) => {
        if (_.startsWith(room, 'username.')) {
            const username = room.substr(room.indexOf('.') + 1);
            users.push(_.toUpper(username));
        }
    });
    return users;
};

this.getOnlineRooms = () => {
    return Object.keys(this.io.sockets.adapter.rooms);
};

/**
 * Send message to all users in a room. Room can be categorised by usergroup or username
 * @see #getUserGroupRoomName
 * @see #getUsernameRoomName
 * @param {String} room  Name of room
 * @param {Object} message  Message to send to users
 * @param {String} [topic]  Topic of message
 * @returns {void}
 */
this.broadcastToRoom = (room, message, topic) => {
    log.info(`message to room '${room}'`, topic, JSON.stringify(message));
    const content = JSON.stringify(message);
    if (!_.isEmpty(room)) {
        this.io.to(room).emit(topic, content);
    }
};
