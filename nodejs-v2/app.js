/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/** @fileoverview  Entry point of the application */

const log = require('log4js').getLogger('App');

// =============== initialize required modules
const _ = require('lodash');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const csrf = require('csurf');
const helmet = require('helmet');
const passport = require('passport');
const compression = require('compression');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const vrpEnum = require('./enum');
const vrpUtils = require('./vrp-common/utils');
const vrpMongo = require('./vrp-common/mongo');
const vrpUserAuth = require('./vrp-user/auth');
const vrpUserUtils = require('./vrp-user/user-utils');
const vrpConfig = require('./configuration');

log.info('Starting server');

// =============== set up middleware to handle sessions
const cookieSecretKey = '202accc3428b73e5cc24ac7886413333392601fed7f5468e2451119ee4ccd187b0f3c5b0fe8';
const sessionMiddleware = session({
    secret: cookieSecretKey,
    rolling: true,
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        url: vrpConfig.get('database.mongo.url'), // store session in MongoDB
    }),
    cookie: {
        secure: vrpConfig.get('server.isHttps'),
        maxAge: vrpConfig.get('auth.session.valid.all') * 1000,
    },
});

// =============== set up middleware to log requests to server
morgan.token('user', (req) => _.get(req, 'user.username', '-'));
morgan.token('fullname', (req) => _.get(req, 'user.fullname', '-'));
morgan.token('role', (req) => _.get(req, 'user.role', '-'));
morgan.token('group', (req) => _.get(req, 'user.usergroup', '-'));
const format = '<Req> username::user || fullname::fullname || role::role || group::group || ip::remote-addr :remote-user || from::referrer || :method :url response::status || time::response-time ms';
const morganFormat = morgan.compile(format);
const loggerMiddleware = morgan(morganFormat, {
    stream: {
        write: (str) => log.info(_.trimEnd(str, '\n')), // remove duplicated newlines
    },
});

module.exports = (async () => {
    // =============== configure node process
    _setupProcessHandlers();

    // =============== configure web server
    const app = express();
    app.use(helmet()); // disable caching of response
    app.use(helmet.noCache()); // disable caching of response
    app.use(compression()); // decrease the size of the response body
    app.use(bodyParser.json({ limit: '50mb' })); // to support JSON-encoded bodies with size limit up to 50 MB
    app.use(bodyParser.urlencoded({ extended: true })); // to support URL-encoded bodies
    app.use(bodyParser.text()); // to support any text string
    app.use(cors(vrpConfig.get('server.cors')));

    let mongodb;
    try {
        log.trace('Connecting to mongodb');

        // ============= setup connection to mongodb
        const dbConnection = await vrpMongo.connect();
        mongodb = dbConnection.db();

        // ============= create required folders
        await vrpUtils.createFolder(vrpConfig.get('tempFolder'));
    } catch (err) {
        log.fatal(err);
        process.exit();
    }

    // ============= set up redirect default path
    app.get('/', (req, res) => res.redirect(vrpConfig.get('server.urls.default')));

    // ============= setup auth router
    await vrpUserAuth.setup(passport, mongodb); // set up authorization

    const routes = vrpConfig.get('server.urls.routers');

    // ============= setup routers (no csrf protection), auth by token only
    _setupMiddlewareRouters(app, mongodb, routes.filter((route) => !route.csrf && route.token), vrpEnum.RouterType.AUTH_BY_TOKEN_ONLY);

    // ============= setup session
    _setupSession(app);

    // ============= setup routers (no csrf protection), auth by session and token
    _setupMiddlewareRouters(app, mongodb, routes.filter((route) => !route.csrf && !route.token), vrpEnum.RouterType.NO_CSRF);

    // ============= setup csrf protection
    _setupCSRF(app);

    // ============= setup csrf protected routers, auth by session and token
    _setupMiddlewareRouters(app, mongodb, routes.filter((route) => route.csrf && !route.token), vrpEnum.RouterType.WITH_CSRF);

    // ============= setup static routers must run after _setupCSRF for frontend to receive cookie
    _setupStaticRouters(app, vrpConfig.get('server.urls.static'));

    // ============= set up generic middleware
    _setupApiHandler(app);

    return { app, sessionMiddleware };
})();

function _setupProcessHandlers() {
    process.on('exit', () => log.fatal('=== Fatal Error: Application Closed ==='));

    // these handlers prevent server from closing upon error
    process.on('uncaughtException', (err) => log.error('Unhandled Exception at', err));
    process.on('unhandledRejection', (reason) => {
        if (!(reason instanceof Error) || reason.name !== 'FeatureNotEnabled') {
            log.error('Unhandled Rejection at', reason);
        }
    });
}

function _setupSession(app) {
    app.use(cookieParser(cookieSecretKey)); // parse cookies because 'cookie' is true in csrf
    app.use(sessionMiddleware);
    app.use(passport.initialize()); // initialize passport (must init after sessionMiddleware)
    app.use(passport.session()); // persistent login sessions
    app.use((req, res, next) => {
        const maxAge = vrpConfig.get('auth.session.valid.driver');
        // extend session only if the user is a driver (i.e. driver can access for longer time)
        if (req.session.cookie.maxAge !== maxAge && vrpUserUtils.isDriver(req.user)) {
            req.session.cookie.maxAge = maxAge * 1000;
        }
        next();
    });
}

function _setupMiddlewareRouters(app, db, routes, routeType) {
    if (routes) {
        routes
            .filter((route) => (route.file && route.path))
            .forEach((route) => {
                const routeModule = require(route.file);
                app.use(route.path, loggerMiddleware);
                app.use(route.path, routeModule.setup(db, routeType));
                log.trace(`${route.file} will be public access via ${route.path}`);
                app.use(route.path, _genericSuccessMiddleware);
            });
    }
}

function _setupCSRF(app) {
    // cookie to store csrf secret key
    app.use(csrf({
        cookie: {
            secure: vrpConfig.get('server.isHttps'),
        },
        value: (req) => req.headers['x-xsrf-token'],
    }));

    app.use((req, res, next) => {
        // @see https://stackoverflow.com/questions/25101804/csrf-token-issues-with-express
        // @see https://github.com/expressjs/csurf/issues/14
        res.cookie('xsrf-token', req.csrfToken());
        next();
    });
}

function _setupStaticRouters(app, settings) {
    if (settings) {
        settings
            .filter((s) => s.folder && s.path) // remove invalid settings
            .forEach(async (s) => {
                try {
                    await vrpUtils.isFolderExist(s.folder);

                    log.info(`${s.folder} will be public access via /${s.path}`);
                    app.use(`/${s.path}`, express.static(`${__dirname}/${s.folder}`));
                } catch (err) {
                    log.warn(`${s.folder} is not found`);
                }
            });
    }
}

function _setupApiHandler(app) {
    // middlewares here will affect all api and static assets routes
    app.use(_genericErrorMiddleware); // remove stacks from error responses
}

function _genericSuccessMiddleware(req, res, next) {
    if (req.status === undefined && req.answer === undefined) {
        res.sendStatus(404);
    } else {
        res.status(_.get(req, 'status', 200)).json(req.answer);
    }
}

function _genericErrorMiddleware(err, req, res, next) {
    // err can be either {status: %%, message: %%, logged: (boolean)} or just the error itself
    let httpStatus = _.get(err, 'status', 500);

    let response;
    if (err.code === 'EBADCSRFTOKEN') {
        httpStatus = 403;
        response = 'Session has expired or form was tampered with.'; // invalid csrf token
    } else if (_.isArray(err)) {
        response = _.map(err, (e) => _simplifyError(req, e));
    } else {
        response = _simplifyError(req, err);
    }

    return res.status(httpStatus).json(response);
}

function _simplifyError(req, error) {
    const message = (_.isPlainObject(error) && _.has(error, 'message')) ? _.get(error, 'message') : error;

    const { code, errors } = vrpUtils.parseError(message);
    // print mapping of url to error code for easy debugging
    log.error(`Code: ${code}, URL: ${req.originalUrl}, Username: ${_.get(req.user, 'username')}`);
    return errors;
}
