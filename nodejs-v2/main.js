/**
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/** @fileoverview  Binds the application to a network port */

const log = require('log4js').getLogger('App');

// =============== initialize required modules
const _ = require('lodash');
const http = require('http');
const https = require('https');
const vrpUtils = require('./vrp-common/utils');
const { vrpSocket } = require('./vrp-common/socket');
const mainApp = require('./app');
const vrpConfig = require('./configuration');

(async () => {
    let server;
    try {
        log.trace('Setting HTTP/HTTPS server');

        // ============= initialize web server
        const { app, sessionMiddleware } = await mainApp;
        server = await _createServer(app);
        log.info(`Listening at ${global.serverAddress}`);

        // ============= setup websocket component
        vrpSocket.setup(server, sessionMiddleware);
    } catch (err) {
        log.fatal(err);
        process.exit();
    }
})();

async function _createServer(app) {
    const timeout = 24 * 3600 * 1000; // set timeout for waiting response = 1 day

    try {
        let server;
        let protocol;

        if (!vrpConfig.get('server.isHttps')) {
            protocol = 'http';
            server = http.createServer(app);

        } else {
            // read all ssl certs at the same time
            const sslKeyPromise = vrpUtils.readFile(vrpConfig.get('server.https.ssl.key'), false);
            const sslCertPromise = vrpUtils.readFile(vrpConfig.get('server.https.ssl.cert'), false);
            const sslCaPromises = _.map(vrpConfig.get('server.https.ssl.intermediates'), (file) => vrpUtils.readFile(file));

            const httpsOptions = {
                key: await sslKeyPromise,
                cert: await sslCertPromise,
                ca: await Promise.all(sslCaPromises),
            };

            protocol = 'https';
            server = https.createServer(httpsOptions, app);
        }

        return new Promise((resolve) => {
            const port = vrpConfig.get(`server.${protocol}.port`);
            server
                .setTimeout(timeout)
                .listen(port, function listen() {
                    global.serverAddress = `${protocol}://localhost:${port}`;
                    resolve(this);
                });
        });
    } catch (err) {
        throw err;
    }
}
