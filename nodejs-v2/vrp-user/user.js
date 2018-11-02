/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('User');

const _ = require('lodash');
const validator = require('validator');
const optionalRequire = require('optional-require')(require);
const vrpSql = optionalRequire('../vrp-sql');
const vrpEnum = require('../enum');
const vrpUserUtils = require('./user-utils');
const vrpPassportUtils = require('./passport-utils');
const vrpUtils = require('../vrp-common/utils');
const vrpMongo = require('../vrp-common/mongo');
const vrpMailer = require('../vrp-common/mailer');
const { vrpSocket, VrpSocketMessage } = require('../vrp-common/socket');

let colUser;
let colUserGroup;
let colSession;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colUser = await vrpMongo.getCollection(mongoDb, 'user');
    colUserGroup = await vrpMongo.getCollection(mongoDb, 'usergroup');
    colSession = await vrpMongo.getCollection(mongoDb, 'sessions');
});

exports.m_changePassword = async (req, res, next) => {
    log.debug('m_changePassword', _.get(req, 'user.username'));

    const username = _.get(req.user, 'username');
    const oldPassword = _.get(req.body, 'oldPassword', null);
    const newPassword = _.get(req.body, 'newPassword', null);

    try {
        // validate passwords
        if (_.isNil(oldPassword)) {
            throw new Error('Parameter `oldPassword` is required.');

        } else if (_.isNil(newPassword)) {
            throw new Error('Parameter `newPassword` is required.');

        } else if (vrpUtils.isSameText(oldPassword, newPassword)) {
            throw new Error('New password cannot be the same as old password');

        } else if (!vrpPassportUtils.isPasswordStrengthOk(newPassword)) {
            throw new Error('Password must contain at least one number, one uppercase and lowercase letter, and at least 8 characters');
        }

        const foundUser = await colUser.findOne({ username: vrpMongo.toCaseInsensitiveRegex(username) });
        if (_.isEmpty(foundUser)) {
            throw new Error('User not found');

        } else if (!vrpPassportUtils.isPasswordCorrect(oldPassword, foundUser.password)) {
            throw new Error('Old password is incorrect');
        }

        const { password } = vrpPassportUtils.createEncryptedPassword(newPassword);

        const result = await colUser.findOneAndUpdate({ username: vrpMongo.toCaseInsensitiveRegex(username) }, {
            $set: {
                change_password_date: new Date(), // for future's requirement, users are forced to change password after a period of time
                password: password, // encrypt password,
                modified_date: new Date(),
            },
        }, {
            upsert: false,
            returnOriginal: false,
        });

        if (!result || !result.value) {
            throw new Error('Unable to change password');
        }

        if (req.user.forceChangePassword === true) {
            // change the value in session
            req.user.forceChangePassword = false;
        }

        req.answer = vrpPassportUtils.formatUserResponse(result.value);
        log.trace('m_changePassword -> updated user object', req.answer);
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_updateUserDetails = async (req, res, next) => {
    const user = _.get(req.body, 'user');

    log.debug('m_updateUserDetails', user);

    try {
        // validation
        if (_.isEmpty(user.username)) {
            throw new Error('Please specify username.');
        }

        // list of fields allowed to be modified
        const modifiableKeys = ['fullname', 'email'];
        if (vrpUserUtils.isAdmin(req.user)) {
            modifiableKeys.push(...['disabled', 'role', 'usergroup', 'phone', 'note']);
        }

        const setter = { modified_date: new Date() };

        for (const key of modifiableKeys) {
            if (user[key]) {
                await _validateFields({ [key]: user[key] });

                switch (key) {
                case 'role':
                    setter.role = _.toLower(user.role);
                    break;
                case 'disabled':
                    setter.disabled = vrpUtils.toBoolean(user.disabled, false);
                    setter.disabled_date = setter.disabled ? new Date() : undefined;
                    break;
                default:
                    setter[key] = user[key];
                    break;
                }
            }
        }

        if (_.size(setter) <= 1) {
            throw new Error('Nothing to update');
        }

        const result = await colUser.updateMany({
            username: vrpMongo.toCaseInsensitiveRegex(user.username),
        }, {
            $set: setter,
        }, {
            upsert: false,
        });

        req.answer = result.modifiedCount;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getUsers = async (req, res, next) => {
    const usernames = _.get(req.query, 'usernames');
    const roles = _.get(req.query, 'roles');
    const projection = _.get(req.query, 'projection');

    try {
        log.debug('m_getUsers', _.get(req, 'user.username'), 'req.query', req.query);

        const filter = Object.assign({}, req.filter || {});
        const onlineUsers = vrpSocket.getOnlineUsers();

        if (usernames) {
            filter.username = {
                $in: _.map(_.split(usernames, ','), vrpMongo.toCaseInsensitiveRegex),
            };
        }

        if (roles) {
            filter.role = {
                $in: _.map(_.split(roles, ','), vrpMongo.toCaseInsensitiveRegex),
            };
        }

        const project = { _id: true, username: true, role: true, disabled: true, modified_date: true };
        if (projection) {
            _.each(_.split(projection, ','), (key) => {
                const field = _.toUpper(key);
                if (field !== 'PASSWORD' && field !== 'ISONLINE' && field !== 'NRIC') { // these cannot be projected
                    project[key] = true;
                }
            });
        }

        const foundUsers = await colUser.find(filter, { projection: project }).toArray();
        if (_.includes(projection, 'isOnline')) {
            _.each(foundUsers, (user) => {
                user.isOnline = (_.includes(onlineUsers, _.toLower(user.username)));
            });
        }

        req.answer = foundUsers;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_createUser = async (req, res, next) => {
    const user = req.body;

    try {
        log.debug('m_createUser', _.get(req, 'user.username'), user);

        if (_.isEmpty(user.username)) {
            throw new Error('Please specify username.');
        }

        const foundUser = await colUser.findOne({
            $or: [
                { username: vrpMongo.toCaseInsensitiveRegex(user.username) },
                { nric: vrpMongo.toCaseInsensitiveRegex(user.nric) },
            ],
        });

        if (!_.isEmpty(foundUser)) {
            if (vrpUtils.isSameText(foundUser.username, user.username)) {
                throw new Error('User with same username already exist');

            } else if (vrpUtils.isSameText(foundUser.nric, user.nric)) {
                throw new Error('User with same NRIC already exist');
            }
        }

        await _validateFields(user);

        log.info('Creating new user', user.username);
        const { password, plainText } = vrpPassportUtils.createEncryptedPassword();
        user.password = password; // encrypt password
        user.created_date = new Date();
        user.modified_date = new Date();
        user.nric = _.toUpper(user.nric);

        const fields = ['fullname', 'username', 'password', 'usergroup', 'email', 'role', 'disabled', 'created_date', 'modified_date', 'nric', 'phone', 'note'];
        await colUser.insertOne(_.pick(user, fields));

        // notify user of new password
        await _notifyPasswordToUser({ user: _.pick(user, ['username', 'fullname', 'email']), plainText });

        req.answer = { message: `${user.username} has been registered successfully` };
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_resetPassword = async (req, res, next) => {
    const usernames = vrpUtils.toArray(_.get(req.body, 'usernames'));

    try {
        log.debug('m_resetPassword', usernames);

        if (_.isEmpty(usernames)) {
            throw new Error('You must specify usernames in body');
        }

        const promises = _.map(usernames, async (username) => {
            const { password, plainText } = vrpPassportUtils.createEncryptedPassword();

            const updateResult = await colUser.findOneAndUpdate({
                username: vrpMongo.toCaseInsensitiveRegex(username),
            }, {
                $unset: { change_password_date: 1 },
                $set: {
                    password: password,
                    modified_date: new Date(),
                },
            }, {
                projection: { _id: 0, username: 1, email: 1, fullname: 1 },
                upsert: false,
            });

            return { user: updateResult.value, plainText };
        });

        const result = await Promise.all(promises);

        // notify user of new password
        await _notifyPasswordToUser(result);

        // only valid updates will have `user` (i.e. result.value)
        req.answer = _.filter(result, 'user').length;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_disableUsers = async (req, res, next) => {
    const usernames = _.get(req.body, 'usernames');

    try {
        log.debug('m_disableUsers', usernames);

        if (_.isEmpty(usernames)) {
            throw new Error('You must specify username in body');
        }

        const result = await colUser.updateMany({
            username: { $in: _.map(vrpUtils.toArray(usernames), vrpMongo.toCaseInsensitiveRegex) },
        }, {
            $set: {
                disabled: true,
                disabled_date: new Date(),
                modified_date: new Date(),
            },
        }, {
            upsert: false,
        });

        req.answer = result.modifiedCount;

        await _unassignVehicle(usernames);
        await _deleteSessionByUsername(usernames, true);

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_enableUsers = async (req, res, next) => {
    const usernames = _.get(req.body, 'usernames');

    try {
        log.debug('m_enableUsers', usernames);

        if (_.isEmpty(usernames)) {
            throw new Error('You must specify username in body');
        }

        const result = await colUser.updateMany({
            username: { $in: _.map(vrpUtils.toArray(usernames), vrpMongo.toCaseInsensitiveRegex) },
        }, {
            $unset: {
                disabled_date: 1,
            },
            $set: {
                disabled: false,
                modified_date: new Date(),
            },
        }, {
            upsert: false,
        });

        req.answer = result.modifiedCount;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_deleteUsers = async (req, res, next) => {
    const usernames = _.compact(_.split(_.get(req.query, 'usernames'), ','));

    try {
        log.debug('m_deleteUser', _.get(req, 'user.username'), usernames);

        if (_.isEmpty(usernames)) {
            throw new Error('You must specify username in query params');
        }

        const result = await colUser.deleteMany({
            username: {
                $in: _.map(vrpUtils.toArray(usernames), vrpMongo.toCaseInsensitiveRegex),
            },
        });

        req.answer = result.deletedCount;
        log.debug(`${req.answer} document(s) deleted`);

        await _unassignVehicle(usernames);
        await _deleteSessionByUsername(usernames, true);

        next();
    } catch (err) {
        next(err);
    }
};

async function _validateFields(user) {
    if (user.role && !vrpUserUtils.isValidRole(user.role)) {
        throw new Error('Please specify a valid user role.');
    } else if (user.password && !vrpPassportUtils.isPasswordStrengthOk(user.password)) {
        throw new Error('Password must contain at least one number, one uppercase and lowercase letter, and at least 8 characters');
    } else if (user.email && !validator.isEmail(user.email)) {
        throw new Error('Invalid email address');
    } else if (user.phone && !validator.isMobilePhone(user.phone)) {
        throw new Error('Invalid phone');
    } else if (user.usergroup) {
        const foundGroup = await colUserGroup.findOne({ usergroup: vrpMongo.toCaseInsensitiveRegex(user.usergroup) });
        if (!foundGroup) {
            throw new Error('Invalid usergroup');
        }
    }
}

async function _unassignVehicle(usernames) {
    if (!vrpSql) {
        return;
    }

    const dbRecords = await vrpSql.Vehicle.findAll({
        where: {
            DriverUsername: usernames,
        },
    });

    // unassign driver from vehicle
    await vrpSql.Vehicle.update({
        DriverUsername: null,
    }, {
        where: {
            DriverUsername: usernames,
        },
    });

    // group messages by usergroup
    const plannerMessages = _.groupBy(dbRecords, 'UserGroup');
    _.each(plannerMessages, (vehicles, usergroup) => {
        new VrpSocketMessage(vrpEnum.SocketTopic.VEHICLE)
            .setPurpose('update')
            .setContent(_.map(vehicles, (vehicle) => {
                vehicle.DriverUsername = null;
                return vehicle;
            }))
            .setSender('System')
            .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
    });
}

async function _deleteSessionByUsername(usernames, emitWs) {
    try {
        const users = _.concat(usernames);

        // emit socket message to inform that session will be killed
        if (emitWs === true) {
            new VrpSocketMessage(vrpEnum.SocketTopic.LOGOUT)
                .emit(users);
        }

        const result = await colSession.deleteMany({
            session: {
                $regex: `"username":"${users.join('|')}"`,
                $options: 'i',
            },
        });

        log.trace(`Clear session other ${result.deletedCount} session`);
    } catch (err) {
        let errMsg = 'Unable to clear sessions from MongoStore\n';
        if (err instanceof Error) {
            errMsg += `${err.name}: ${err.message}`;
        } else {
            errMsg += `${err}`;
        }
        throw errMsg;
    }
}

/**
 * Notify users of password changes
 * @param {Object[]} result  List of user information to notify
 * @param {String} plainText  Password in plain text
 * @param {Object} result.user  User information
 * @param {String} result.user.email  Email of user
 * @param {String} result.user.fullname  Name of user (Default: 'User')
 * @returns {void}
 */
async function _notifyPasswordToUser(result) {
    if (vrpPassportUtils.useDefaultPassword()) {
        // no need to send email for default passwords
        return;
    }

    const errors = [];
    for (const credentials of _.concat(result)) {
        try {
            log.debug('Sending password email to', _.omit(credentials, ['plainText']));
            if (credentials.user && credentials.user.email) {
                const name = _.get(credentials, 'user.fullname', 'User');
                await vrpMailer.sendEmail({
                    to: credentials.user.email,
                    subject: 'Password Reset',
                    html: `Dear ${name},<br><br>Your password has been set to <strong>${credentials.plainText}</strong>.
                    Please contact your administrator if this is unintended.`,
                    disableReply: true,
                });
            } else {
                throw new Error(`${credentials.user.username} does not have email`);
            }
        } catch (err) {
            log.warn('Fail to notify users of password', _.omit(credentials, ['plainText'], err));
            errors.push(`Fail to notify ${credentials.user.username} by email (${err.message || err})`);
        }
    }

    if (!_.isEmpty(errors)) {
        throw errors;
    }
}
