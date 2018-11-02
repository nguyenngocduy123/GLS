/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Auth');

const _ = require('lodash');
const moment = require('moment');
const schedule = require('node-schedule');
const optionalRequire = require('optional-require')(require);
const vrpEnum = require('../enum');
const vrpSql = optionalRequire('../vrp-sql');
const vrpUserUtils = require('./user-utils');
const vrpPassportUtils = require('./passport-utils');
const vrpConfig = require('../configuration');
const vrpMongo = require('../vrp-common/mongo');
const vrpUtils = require('../vrp-common/utils');
const {
    vrpSocket,
    VrpSocketMessage
} = require('../vrp-common/socket');

const MAX_FAILED_LOGIN_ATTEMPTS = vrpConfig.get('auth.login.maxFailAttempts');
const WAITING_TIME_AFTER_LOCKED = vrpConfig.get('auth.login.waitingTimeAfterLocked');

let colUser;
let colSession;
let lockedAccess = [];

/**
 * setup passport to authenticate users
 * @param {Object} passport  Instance of passport object
 * @param {Object} db  Instance of mongodb
 * @returns {void}
 */
exports.setup = vrpUtils.setupOnce(this, async (passport, mongoDb) => {
    colUser = await vrpMongo.getCollection(mongoDb, 'user');
    colSession = await vrpMongo.getCollection(mongoDb, 'sessions');

    // setup passport scheme to authenticate/create users
    vrpPassportUtils.setup(passport, (username) => colUser.findOne({
        username: vrpMongo.toCaseInsensitiveRegex(username),
    }));

    // cron job to clear lockedAccess at the end of the day
    schedule.scheduleJob('23 59 * * *', () => {
        lockedAccess = [];
    });
});

exports.m_isAuthAdmin = [m_isLoggedIn, m_isRole(vrpEnum.UserRole.ADMIN)];
exports.m_isAuthPlanner = [m_isLoggedIn, m_isRole(vrpEnum.UserRole.PLANNER)];
exports.m_isAuthDriver = [m_isLoggedIn, m_isRole(vrpEnum.UserRole.DRIVER)];
exports.m_isAuthController = [m_isLoggedIn, m_isRole(vrpEnum.UserRole.CONTROLLER)];


exports.m_isAuthAdminOrPlanner = [m_isLoggedIn, m_isRole([vrpEnum.UserRole.ADMIN, vrpEnum.UserRole.PLANNER, vrpEnum.UserRole.CONTROLLER])];
exports.m_isAuthPlannerOrDriver = [m_isLoggedIn, m_isRole([vrpEnum.UserRole.PLANNER, vrpEnum.UserRole.DRIVER, vrpEnum.UserRole.CONTROLLER])];
exports.m_isAuthNotDriver = [m_isLoggedIn, m_isRole([vrpEnum.UserRole.ADMIN, vrpEnum.UserRole.PLANNER, vrpEnum.UserRole.DEFAULT, vrpEnum.UserRole.CONTROLLER])];
exports.m_isAuthPlannerOrController = [m_isLoggedIn, m_isRole([vrpEnum.UserRole.PLANNER, vrpEnum.UserRole.CONTROLLER])];

exports.m_isLoggedIn = m_isLoggedIn;
exports.m_login = [m_checkIfAccessLocked, m_login, m_resetFailedLoginIfLoginSuccess];
exports.m_logout = [m_isLoggedIn, m_logoutCurrentSession];

/**
 * Force specific user to log out
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_forceLogoutByUsername = async (req, res, next) => {
    const usernames = _.get(req.body, 'usernames', []);

    log.debug('m_forceLogoutByUsername', usernames);

    try {
        if (_.isEmpty(usernames)) {
            throw new Error('Please specify usernames.');
        }

        const result = await _deleteSessions(usernames, true);

        req.answer = result.deletedCount;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_userFilter = (req, res, next) => {
    req.filter = req.filter || {};

    const username = _.get(req, 'user.username');
    if (!vrpUserUtils.isAdmin(req.user)) {
        // $elemMatch must be used, otherwise the positional operator in the queries will set index based on this
        Object.assign(req.filter, {
            username: {
                $elemMatch: {
                    $in: [vrpMongo.toCaseInsensitiveRegex(username)]
                }
            }
        });
    }
    next();
};

exports.m_userGroupFilter = (req, res, next) => {
    req.filter = req.filter || {};

    const usergroup = _.get(req, 'user.usergroup');
    if (usergroup) {
        Object.assign(req.filter, {
            usergroup: usergroup.toUpperCase()
        });
    }
    next();
};

/**
 * Middleware to send username and role in lowercase as response.
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_returnUserInfo = async (req, res, next) => {
    log.debug('m_returnUserInfo', req.user.username);

    const response = Object.assign({
        token: _.get(req, 'user.token')
    }, req.user);

    if (_.isEmpty(req.user)) {
        req.status = 401;
    } else if (!vrpUserUtils.isDriver(req.user)) {
        req.answer = response;
    } else {
        try {
            const dbRecord = await vrpSql.Vehicle.scope(req.scopes.authz).findOne({
                where: {
                    DriverUsername: req.user.username,
                },
                raw: true,
                attributes: ['Id', 'PlateNumber', 'UserGroup'],
            });

            response.vehicleId = _.get(dbRecord, 'Id');
            response.vehiclePlateNumber = _.get(dbRecord, 'PlateNumber');
            response.vehicleUserGroup = _.get(dbRecord, 'UserGroup');
        } catch (err) {
            log.trace(err); // ignore error
        } finally {
            response.serverDate = moment(); // set serverDate just before returning response
            response.noteOptions = vrpConfig.get('driverApp.note');
            response.podOptions = vrpConfig.get('driverApp.pod');
            response.itemOptions = vrpConfig.get('driverApp.item');
            response.statusLabels = vrpConfig.get('driverApp.statusLabels');
            req.answer = response;
        }
    }
    next();
};

/* ================================================================================
 *  Private Middlewares
 * ================================================================================ */
function m_isLoggedIn(req, res, next) {
    
    log.debug('m_isLoggedIn', _.get(req, 'user.username'));

    vrpPassportUtils.isLoggedIn((err) => {
        if (err) {
            next({
                status: 401,
                message: err.message
            });
        } else {
            next();
        }
    })(req, res, next);
}

function m_login(req, res, next) {
    
    log.debug('m_login');

    return vrpPassportUtils.login(async (err, user) => {
        try {
            if (err) { // wrong either username and password
                if (err instanceof Error && err.name === 'AccountDisabled') { // if account was disabled
                    throw err;
                } else {
                    _lockIfFailedAttemptsReachLimit(req); // will always throw error
                }
            } else if (vrpUserUtils.isAdmin(user)) {
                await _deleteSessions(user.username, true); // logout all other session

            } else if (vrpUserUtils.isPlanner(user) || vrpUserUtils.isDriver(user) || vrpUserUtils.isController(user)) {
                const currentSessionId = _.get(req, 'sessionID'); // get currentSessionId
                await _checkIfLoggedInElsewhere(user.username, currentSessionId);
            }

            req.logIn(user, next);
        } catch (err) {
            next(err);
        }
    })(req, res, next);
}

async function m_logoutCurrentSession(req, res, next) {
    try {
        const username = _.get(req, 'user.username');
        log.debug('m_logoutCurrentSession', username);
        req.logout();

        // in case session is not destroyed at req.logout
        if (!_.isNil(req.session)) {
            req.session.destroy((err) => {
                if (!_.isNil(err)) {
                    log.trace('Cannot destroy session', err);
                }
            });
        }

        if (username) {
            await _deleteSessions(username, false);
        }

        req.answer = {
            logout: true
        };
        next();
    } catch (err) {
        next(err);
    }
}

function m_checkIfAccessLocked(req, res, next) {
    const id = _getAccessIdFromRequest(req);
    const account = lockedAccess.find((access) => access.id === id);
    if (account && account.nFailedLogin > 0) {
        if (account.locked) {
            const waitingTimeLeft = _getLockedAccessWaitingTime(account);
            if (waitingTimeLeft > 0) {
                next(`Your session has been locked. Please try again after ${waitingTimeLeft.toFixed(0)} seconds`);
            } else {
                _.remove(lockedAccess, {
                    id
                }); // remove from locked list
                next();
            }
        } else {
            next();
        }
    } else {
        next();
    }
}

function m_resetFailedLoginIfLoginSuccess(req, res, next) {
    const id = _getAccessIdFromRequest(req);
    _.remove(lockedAccess, {
        id
    });
    next();
}

function m_isRole(roles) {
    roles = _.map(_.concat(roles), _.capitalize);
    return (req, res, next) => {
        log.debug('m_isRole', roles, _.get(req, 'user.username'));

        if (_.includes(roles, _.capitalize(_.get(req, 'user.role')))) {
            next();
        } else {
            next({
                status: 403,
                message: `Forbidden: ${_.join(roles, ', ')} permission is required to access.`,
            });
        }
    };
}

/* ================================================================================
 *  Private Functions
 * ================================================================================ */
async function _deleteSessions(usernames, emitWs) {
    try {
        const users = vrpUtils.toArray(usernames);

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

        log.trace(`Clear session other ${_.get(result, 'result.n')} session`);

        // force all user sockets to disconnect
        vrpSocket.forceDisconnect(users);

        return result;
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

function _lockIfFailedAttemptsReachLimit(req) {
    const id = _getAccessIdFromRequest(req);
    let account = lockedAccess.find((s) => s.id === id);

    if (!account) {
        account = {
            id,
            nFailedLogin: 1,
            failedLoginAt: new Date(),
            locked: false
        };
        lockedAccess.push(account);
    } else {
        account.nFailedLogin++;
        account.failedLoginAt = new Date();
    }

    const nFailed = account.nFailedLogin;
    let errMsg = `Invalid username or password. You have tried ${nFailed}/${MAX_FAILED_LOGIN_ATTEMPTS} login attempts`;
    if (nFailed >= MAX_FAILED_LOGIN_ATTEMPTS) {
        account.locked = true;
        errMsg += `. Your session has been locked out for ${WAITING_TIME_AFTER_LOCKED} seconds.`;
    }

    throw errMsg;
}

function _getAccessIdFromRequest(req) {
    return _.toUpper(_.get(req.body, 'username'));
}

async function _checkIfLoggedInElsewhere(userName, currentSessionId) {
    try {
        const selector = {
            session: {
                $regex: `"username":"${userName}"`,
                $options: 'i'
            }
        };
        if (currentSessionId) {
            selector._id = {
                $ne: currentSessionId
            };
        }

        const result = await colSession.findOne(selector);
        if (result) {
            const error = new Error(`${userName} is currently logged in on another device.`);
            error.name = 'CurrentlyLoggedIn';
            throw error;
        }
    } catch (err) {
        if (err instanceof Error && err.name === 'CurrentlyLoggedIn') {
            throw err;
        } else {
            throw new Error(`Unable to clear sessions from MongoStore: ${err.name}: ${err.message}`);
        }
    }
}

function _getLockedAccessWaitingTime(account) {
    const durationSinceLocked = moment.duration(moment().diff(moment(account.failedLoginAt))).asSeconds();
    return (WAITING_TIME_AFTER_LOCKED - durationSinceLocked);
}