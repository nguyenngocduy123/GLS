/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/**
 * @fileoverview User settings.
 * For full list of settings, refer to configuration.js.
 * Unit for time is ALWAYS in seconds */

module.exports = {
    timezone: '+08:00',
    tempFolder: 'tmp', // folder to store scratch files
    server: {
        http: {
            port: 81,
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
            origin: [
                'http://localhost:4200',
                'http://localhost:8100',
            ],
        },
        urls: {
            default: '/planner', // "/" will be redirected to this path
            static: [ // folders to be public by express
                // for frontend version 2
                {
                    path: 'planner',
                    //folder: 'node_modules/@simtech/vrp-frontend-gls'
                    folder: 'public/dist'
                },

                // for driver version 2
                {
                    path: 'license',
                    folder: 'public/privacy-policy'
                },
                {
                    path: 'driver2',
                    folder: 'node_modules/@simtech/vrp-driver-dist'
                },

                // apidoc
                {
                    path: 'docs',
                    folder: 'public/apidocs'
                },
            ],
        },
    },
    map: {
        graphhopper: { // https://github.com/graphhopper/graphhopper
            url: 'http://localhost:8989',
        },
        osrm: {
            // url: 'http://localhost:3002',          
            url: 'http://13.76.242.188:3002',
            new: false, // (false) https://github.com/niemeier-PSI/osrm-backend, (true) https://github.com/Project-OSRM/osrm-backend
            compressUrl: true,
        },
    },
    database: {
        mongo: {
            //url: 'mongodb://admin:vrp123456@127.0.0.1:27017/cvrp',
            url: 'mongodb://192.168.50.211:27017/cvrp',
        },
        // sql: { // http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
        //     username: 'sa',
        //     password: '12345678',
        //     host: 'localhost',
        //     port: 1433,
        //     dialect: 'mssql',
        //     database: 'GLS_Test',
        //     custom: { // application-specific
        //         schema: 'Logistics',
        //         maxDeleteCount: 10000,                
        //     },
        // },
        // sql: {
        //     username: 'mcloyalty',
        //     password: '@TEG123@',
        //     host: '115.78.6.171',
        //     port: 1433,
        //     dialect: 'mssql',
        //     database: 'GLS_Test',
        //     custom: { // application-specific
        //         schema: 'Logistics',
        //         maxDeleteCount: 10000,
        //     },
        // },
         sql: {
            username: 'gls',
            password: 'G!Ukd^7f#SpAJ&eo',
            host: 'VM-BESV2',
            port: 1433,
            dialect: 'mssql',
            database: 'GLS_Test',
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
            service: 'Gmail',
            auth: {
                type: 'OAuth2',
                user: '',
                clientId: '',
                clientSecret: '',
                refreshToken: '',
            },
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
    },
    log: {
        categories: { // refer to configuration.js for list of valid appenders and categories
            default: {
                appenders: ['console'],
                level: 'trace'
            },
            Sql: {
                appenders: ['console'],
                level: 'warn'
            },
        },
    },
};