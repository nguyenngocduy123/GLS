/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/**
 * @file Handles authentication based on [`passport` library](https://github.com/jaredhanson/passport).
 * Initial login (`login`) creates a session.
 * Subsequent requests (`isLoggedIn`) allows token authentication.
 */

const log = require('log4js').getLogger('User');

const _ = require('lodash');
const bCrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const passportLocal = require('passport-local'); // authentication by user credentials
const passportJWT = require('passport-jwt'); // authentication by token
const passwordGenerator = require('generate-password');
const vrpUtils = require('../vrp-common/utils');
const vrpConfig = require('../configuration');

const TOKEN_KEY = 'x-access-token';
const TOKEN_SECRET = 'vrpToken';
const TOKEN_VALIDITY = vrpConfig.get('auth.token.valid.all');
const DEFAULT_PASSWORD = vrpConfig.get('auth.password.default');
const FORCE_PASSWORD_COMPLEXITY = vrpConfig.get('auth.password.complex');

let passport;

/**
 * Setup passport to authenticate users
 * @param {Object} _passport  Instance of passport object
 * @param {Function} getUserByUsernameQuery(username,done)  Callback function to query user
 * @returns {void}
 */
exports.setup = vrpUtils.setupOnce(this, (_passport, getUserByUsernameQuery) => {
    passport = _passport;

    passport.deserializeUser((user, done) => done(null, user));
    passport.serializeUser((user, done) => {
        if (_.isEmpty(user)) {
            done(null, user, { message: 'Invalid username or password' }); // instead of returning error like failed to serialize user
        } else {
            done(null, user);
        }
    });

    // check credentials/token against the database
    const validateUser = _validateUser(getUserByUsernameQuery);

    // setup username and password authentication for login
    const LocalStrategy = passportLocal.Strategy;
    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
    }, async (username, password, done) => {
        try {
            log.trace('Authenticating', username);
            const user = await validateUser(username, password);
            // since token will be validated against database, only username is required
            user.token = jwt.sign({ username: user.username }, TOKEN_SECRET, {
                expiresIn: Math.round(TOKEN_VALIDITY),
            });
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));

    // setup token authentication
    const JwtStrategy = passportJWT.Strategy;
    const ExtractJwt = passportJWT.ExtractJwt;
    passport.use(new JwtStrategy({
        secretOrKey: TOKEN_SECRET,
        jwtFromRequest: ExtractJwt.fromExtractors([
            ExtractJwt.fromHeader(TOKEN_KEY),
            ExtractJwt.fromUrlQueryParameter(TOKEN_KEY),
        ]),
        passReqToCallback: true,
    }, async (req, decoded, done) => {
        try {
            if (!decoded || !_.has(decoded, 'username')) {
                throw new Error({ message: 'Invalid token' });
            }

            const user = await validateUser(decoded.username);
            user.token = req.headers[TOKEN_KEY] || req.query[TOKEN_KEY];
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }));
});

/**
 * @param {Function} callback  override default manner in which authentication attempts are handled.
 * @returns {void}
 */
exports.login = (callback) => {
    return (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            const error = err || info;
            if (error) {
                callback(error);
            } else {
                callback(null, user);
            }
        })(req, res, next);
    };
};

/**
 * @param {Function} callback  override default manner in which authentication attempts are handled.
 * @returns {void}
 */
exports.isLoggedIn = (callback) => {
    return (req, res, next) => {
        // login by session
        if (req.isAuthenticated()) {
            log.trace(`Username ${_.get(req, 'user.username')} is authenticated by session login`);
            callback();
        } else {
            // login by token
            passport.authenticate('jwt', (err, user, info) => {
                const error = err || info;
                if (error instanceof Error && error.message === 'No auth token') {
                    callback({ message: 'You have not logged in or your session has ended' });
                } else if (error) {
                    callback(error);
                } else {
                    req.user = user;
                    log.trace(`Username ${_.get(req, 'user.username')} is authenticated by token`);
                    callback();
                }
            })(req, res, next);
        }
    };
};

exports.useDefaultPassword = () => {
    return DEFAULT_PASSWORD !== false;
};

exports.createEncryptedPassword = (password) => {
    // if password not provided, then either use default password or generate random password
    if (!password) {
        if (this.useDefaultPassword()) {
            password = DEFAULT_PASSWORD;
        } else {
            password = passwordGenerator.generate({
                length: 8,
                numbers: true,
                uppercase: true,
                strict: true,
            });
        }
    }
    return {
        plainText: password,
        password: bCrypt.hashSync(password, bCrypt.genSaltSync(10), null), // encrypt password
    };
};

exports.isPasswordStrengthOk = (password) => {
    if (!FORCE_PASSWORD_COMPLEXITY) {
        return true;
    } else {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password);
    }
};

exports.isPasswordCorrect = (password, encryptedPassword) => {
    return !encryptedPassword || bCrypt.compareSync(password, encryptedPassword);
};

function _validateUser(queryDbForUser) {
    return async (inputUsername, inputPassword) => {
        try {
            // get user information from database
            const user = await queryDbForUser(inputUsername);

            // validate user based on information from database
            const username = _.get(user, 'username');
            if (!user || _.isEmpty(username)) {
                log.trace(`No user with username ${inputUsername}`);
                throw new Error('Invalid username or password'); // generic message to prevent user enumeration

            } else if (user.disabled) {
                log.trace('Account has been disabled');
                const error = new Error('Your account has been disabled by administrator.');
                error.name = 'AccountDisabled';
                throw error;

            } else if (!_.isNil(inputPassword) && !exports.isPasswordCorrect(inputPassword, _.get(user, 'password'))) {
                log.trace(`Incorrect password for ${username}`);
                throw new Error('Invalid username or password'); // generic message to prevent user enumeration
            }

            return exports.formatUserResponse(user);
        } catch (err) {
            throw err;
        }
    };
}

exports.formatUserResponse = (user) => {
    return {
        _id: _.get(user, '_id'),
        username: _.get(user, 'username'),
        fullname: _.get(user, 'fullname'),
        role: _.get(user, 'role', null),
        usergroup: _.get(user, 'usergroup', null),
        forceChangePassword: !_.get(user, 'change_password_date'),
    };
};
