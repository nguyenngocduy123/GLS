/*
* Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
*
* Unauthorized copying of this file, via any medium is strictly prohibited
* Proprietary and confidential
*/
'use strict';

/**
 * @fileoverview Full list of system settings/configurations.
 * Do not modify @private settings unless you know what you are doing.
 * Unit for time is ALWAYS in seconds */

const _ = require('lodash');
const log4js = require('log4js');
const log = log4js.getLogger('Config');
log.level = 'info';

const optionalRequire = require('optional-require')(require);
const { JOB } = optionalRequire('./vrp-data/classes') || { JOB: null };

const DEFAULTS = Object.freeze({
    timezone: '+08:00',
    tempFolder: 'tmp', // folder to store scratch files
    server: {
        isHttps: _.includes(process.argv, 'https'),
        http: {
            port: 80,
        },
        https: { // https://nodejs.org/api/https.html#https_https_createserver_options_requestlistener
            port: 443,
            ssl: {
                cert: '', // .crt file extension
                key: '', // .key file extension
                intermediates: [], // .crt file extension
            },
        },
        cors: { // https://github.com/expressjs/cors#configuration-options
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
            origin: [],
        },
        urls: {
            default: '/planner', // "/" will be redirected to this path
            static: [ // folders to be public by express
                // for frontend version 2
                { path: 'planner', folder: 'node_modules/@simtech/vrp-frontend-gls' },

                // for driver version 2
                { path: 'license', folder: 'public/privacy-policy' },
                { path: 'driver2', folder: 'node_modules/@simtech/vrp-driver-dist' },

                // apidoc
                { path: 'docs', folder: 'public/apidocs' },
            ],
            routers: [ // @private
                // no prefix = no auth at all
                { csrf: false, path: '/map', file: './vrp-map-service/map-router' }, // map service
                { csrf: false, path: '/problem', file: './vrp-problem/problem-router' }, // problem REST service

                // prefix /rest = no csrf, if auth enabled, then auth by token only
                { csrf: false, token: true, path: '/rest/data', file: './vrp-data/data-router' }, // data REST service

                // prefix /api = no csrf, if auth enabled, then auth by session and token
                { csrf: false, path: '/api/auth', file: './vrp-user/auth-router' }, // authentication service
                { csrf: false, path: '/api/message', file: './vrp-message/message-router' }, // message REST service
                { csrf: false, path: '/api/user', file: './vrp-user/user-router' }, // user REST service
                { csrf: false, path: '/api/data', file: './vrp-data/data-router' }, // data REST service

                // prefix /web = with csrf protection, if auth enabled, then auth by session and token
                { csrf: true, path: '/web/map', file: './vrp-map-service/map-router' }, // map service
                { csrf: true, path: '/web/auth', file: './vrp-user/auth-router' }, // authentication service
                { csrf: true, path: '/web/message', file: './vrp-message/message-router' }, // message REST service
                { csrf: true, path: '/web/usergroup', file: './vrp-user/user-group-router' }, // user group REST service
                { csrf: true, path: '/web/user', file: './vrp-user/user-router' }, // user REST service
                { csrf: true, path: '/web/problem', file: './vrp-problem/problem-router' }, // problem REST service
                { csrf: true, path: '/web/data', file: './vrp-data/data-router' }, // csrf protected data REST service
            ],
        },
    },
    map: {
        graphhopper: { // https://github.com/graphhopper/graphhopper
            url: 'http://localhost:8989',
        },
        osrm: {
            //url: 'http://13.76.242.188:3002',
            url: 'http://192.168.50.211:3002',
            new: false, // (false) https://github.com/niemeier-PSI/osrm-backend, (true) https://github.com/Project-OSRM/osrm-backend
            compressUrl: true,
        },
    },
    database: {
        mongo: {
            url: 'mongodb://localhost:27017/cvrp',
        },
        sql: { // http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
            username: 'sa',
            password: 'password0000!',
            host: 'localhost',
            port: 1433,
            dialect: 'mssql',
            database: 'Logistics_Test',
            get timezone() { // @private
                return DEFAULTS.timezone;
            },
            dialectOptions: { // http://tediousjs.github.io/tedious/api-connection.html#function_newConnection
                encrypt: true,
            },
            pool: {
                min: 0,
                max: 100,
            },
            custom: { // application-specific
                schema: 'Logistics',
                maxDeleteCount: 10000,
            },
        },
    },
    auth: {
        login: {
            maxFailAttempts: 5,
            waitingTimeAfterLocked: 30,
        },
        password: {
            complex: true, // force new passwords to be complex
            default: 'Password123', // set false to randomise password and send password via email
        },
        token: {
            valid: {
                all: 5 * 24 * 60 * 60,
            },
        },
        session: {
            valid: {
                all: 15 * 60,
                driver: 8 * 60 * 60,
            },
        },
    },
    mail: {
        content: { // application-specific
            subjectPrefix: '[Logistics]',
            reply: '', // if empty = computer-generated message at bottom of the email
            cc: [], // forward all sent email to this list of email addresses
        },
        config: { // https://nodemailer.com/smtp/
        },
    },
    features: { // application-specific
        notifyServiceChit: {
            enable: false, // send service chit to customers after each order completion
            values: {
                companyLogo: {
                    text: '', // text will take precedence over image
                    image: '', // relative to config.js directory
                    size: [120, 130],
                },
                companyName: 'Company Name Here',
                companyAddress: 'Company Address here',
                companyContact: 'Company Phone or Tax here',
                companyEmail: 'Company Email here',
            },
        },
        notifyVerificationCode: {
            enable: false,
            daily: '0500', // send verification code email daily at this time (24 hour format)
        },
        notifyOrderDone: {
            enable: false, // send late/unsuccessful job notification to planner emails
            mailInterval: 30 * 60, // sends notification at an interval
            acceptedBuffer: {
                late: 15 * 60, // send notification only if order is later than specified buffer time
            },
        },
        expectLate: {
            checkInterval: 5 * 60, // check and send expected to be late status to frontend at an interval
        },
        offlineSync: {
            folder: 'data/offline_files', // path to save created files on driver app when no internet connection
        },
    },
    websocket: { // application-specific
        vehicleLog: 10, // send vehicle log from server to frontend at an interval
    },
    driverApp: {
        minVersion: '3.0.0', // minimum version of app that server can support
        pod: {
            photo: {
                required: false, // if driver must take pod photo (i.e. not only signature)
            },
        },
        item: {
            input: {
                default: 'TEXT', // default input mode (accepted values: BARCODE, TEXT)
                allowToggle: false, // whether driver toggle between different item input methods
            },
            barcode: { // https://github.com/phonegap/phonegap-plugin-barcodescanner#using-the-plugin
                formats: 'DATA_MATRIX,UPC_A,UPC_E,EAN_8,EAN_13,CODE_39,CODE_128,ITF',
            },
        },
        note: {
            option: {
                required: false, // if driver must select a note option from the list
                list: [ // list of options that driver can select in note page
                    'Customer Not Around',
                    'Everything Damaged',
                    'Some Damaged',
                    'Other Reasons',
                    'All OK',
                ],
            },
            photo: {
                maxCount: 3, // maximum number of note photos allowed to upload per job attempt
            },
        },
        get statusLabels() { // @private
            if (JOB) {
                return [{ // labels that will be displayed on driver application
                    value: JOB.STATUS.PENDING,
                    label: 'PENDING',
                }, {
                    value: JOB.STATUS.LATE,
                    label: 'LATE',
                }, {
                    value: JOB.STATUS.ONTIME,
                    label: 'ONTIME',
                }, {
                    value: JOB.STATUS.UNSUCCESSFUL,
                    label: 'FAIL',
                }, {
                    value: JOB.STATUS.EXPECTED_TO_BE_LATE,
                    label: 'EXPECT LATE',
                }];
            }
        },
    },
    log: { // https://github.com/log4js-node/log4js-node/tree/master/docs
        appenders: {
            console: { type: 'console' }, // log to console (windows)
            stdout: { type: 'stdout' }, // log to console (linux)
            singleLogFile: { type: 'file', filename: './log/vrp.out', maxLogSize: 10000000, backups: 10 }, // log to file, maxsize = 10MB, 10 backups
            dailyLogFile: { type: 'dateFile', filename: './log/vrp.out', daysToKeep: 30 }, // log to file, 1 day 1 file
            dailyErrorFile: { type: 'dateFile', filename: './log/vrp.err', daysToKeep: 30 }, // log to file, 1 day 1 file
            errors: { type: 'logLevelFilter', appender: 'dailyErrorFile', level: 'error' },
        },
        categories: {
            // by default, use { appenders: ['console'], level: 'info' }
            default: { appenders: ['console'], level: 'info' },
            // Config: { appenders: ['console'], level: 'info' },
            // App: { appenders: ['console'], level: 'info' },
            // Mailer: { appenders: ['console'], level: 'info' },
            // Mongo: { appenders: ['console'], level: 'info' },
            // Socket: { appenders: ['console'], level: 'info' },
            // MapService: { appenders: ['console'], level: 'info' }, // vrp-map-service
            // Engine: { appenders: ['console'], level: 'info' }, // vrp-engine
            // Data: { appenders: ['console'], level: 'info' }, // vrp-data
            // Sql: { appenders: ['console'], level: 'info' }, // vrp-data sql statements and errors
            // Message: { appenders: ['console'], level: 'info' }, // vrp-message
            // Problem: { appenders: ['console'], level: 'info' }, // vrp-problem
            // Auth: { appenders: ['console'], level: 'info' }, // vrp-user (auth)
            // User: { appenders: ['console'], level: 'info' }, // vrp-user (user)
            // UserGroup: { appenders: ['console'], level: 'info' }, // vrp-user (usergroup)
        },
    },
    engine: {
        javaPath: 'java', // path of Java JDK
        chinh: 'chinh-solver-3.6.7.jar',
        siwei: 'siwei-solver-6.9.7.jar',
    },
});

let configuration = DEFAULTS;

let userSettingsFile = global.settings || 'setting.js';
process.argv.forEach((args) => {
    if (args.startsWith('--setting=') || args.startsWith('--settings=')) {
        userSettingsFile = args.split('=')[1];
    }
});
log.info(`Settings file: ${userSettingsFile}`);
_setConfiguration(require(`./${userSettingsFile}`));

/**
 * Returns system configuration
 * @param {String} [key]  Retrieve configuration value for a property. Dot-notation object key is supported.
 * @param {Object} [defaultValue]  If configuration value does not exists, use this value instead.
 * @return {Object|String}  Full system configuration list, OR a specific value based on `key`
 */
exports.get = function _getConfiguration(key, defaultValue) {
    const value = _.get(configuration, key, defaultValue);
    if (value === undefined) {
        log.warn(`<Config> Key ${key} does not exist.`);
    }
    return (key) ? value : configuration;
};

/**
 * Set system configuration, inclusive of user-specific settings file. This file is to ensure
 * that the settings/configuration always have default values for the system files to use.
 * @param {Object} userSettings  Subset of configurations
 * @return {void}
 */
function _setConfiguration(userSettings) {
    configuration = Object.freeze(_.merge({}, DEFAULTS, userSettings));

    // standardise log layout
    _.each(configuration.log.appenders, (appender) => {
        appender.layout = {
            type: 'pattern',
            pattern: '%[[%d] [%p] {%x{lineNo}} %]\n<%c> %m',
            tokens: {
                lineNo: () => new Error().stack.split('\n')[16],
            },
        };
    });

    log4js.configure(configuration.log);
    return this;
};
