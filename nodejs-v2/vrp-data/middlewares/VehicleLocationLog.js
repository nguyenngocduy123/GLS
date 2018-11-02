/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Data');

const _ = require('lodash');
const moment = require('moment');
const vrpSql = require('../../vrp-sql');
const vrpEnum = require('../../enum');
const vrpUtils = require('../../vrp-common/utils');
const vrpMongo = require('../../vrp-common/mongo');
const { VrpSocketMessage } = require('../../vrp-common/socket');
const vrpMapUtils = require('../../vrp-map-service/map-utils');

const SOCKET_TOPIC = vrpEnum.SocketTopic.VEHICLE_LOG;
exports.version = 'v2.1';

/**
 * Stores list of vehicle log websocket messages in `{ [vehicleId]: %recentLog% }` format
 * @example { YE0123M: { Lat: 80, Lng: 103 } }
 */
let vehicleLogsWs = {};

let colVehicleLocationLog = null;
let colVehicleLastSeen = null;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colVehicleLocationLog = await vrpMongo.getCollection(mongoDb, 'vehiclelogs');
    colVehicleLastSeen = await vrpMongo.getCollection(mongoDb, 'vehiclelastseen');
});

exports.m_getLast = async (req, res, next) => {
    log.debug('m_getLastVehicleLocationLog', req.user.username);

    try {
        const dbRecords = await vrpSql.Vehicle.scope(req.scopes.authz).findAll({
            attributes: ['Id'],
            raw: true,
        });

        const lastseenLogs = await colVehicleLastSeen.aggregate([{
            $match: {
                VehicleId: {
                    $in: _.map(dbRecords, 'Id'), // get necessary records only
                },
            },
        }, {
            $group: {
                _id: '$VehicleId', // group by VehicleId
                Lat: {
                    $last: { $arrayElemAt: ['$Coordinates', 1] }, // get the most recent record only ($last)
                },
                Lng: {
                    $last: { $arrayElemAt: ['$Coordinates', 0] },
                },
                VehicleId: { $last: '$VehicleId' },
                VehicleUserGroup: { $last: '$VehicleUserGroup' },
                Accuracy: { $last: '$Accuracy' },
                DriverName: { $last: '$DriverName' },
                PlateNumber: { $last: '$PlateNumber' },
                RecordedTime: { $last: '$RecordedTime' },
            },
        }, {
            $project: {
                _id: 0,
                Lat: 1,
                Lng: 1,
                VehicleId: 1,
                VehicleUserGroup: 1,
                Accuracy: 1,
                DriverName: 1,
                PlateNumber: 1,
                RecordedTime: 1,
            },
        }]).toArray();

        req.answer = lastseenLogs;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createVehicleLocationLog', req.user.username);

    const records = _.get(req.body, 'record');

    try {
        if (_.isNil(records)) {
            throw new Error('Parameter `record` is required.');
        }

        req.answer = 0;
        if (!_.isEmpty(records)) {
            const insertedCount = await createVehicleLocationLog(req, records);
            req.answer = insertedCount || 0;
        }

        next();
    } catch (err) {
        next(err);
    }
};

exports.sendSocketMessages = () => {
    if (!_.isEmpty(vehicleLogsWs)) {
        const vehicleLogsByUserGroup = {};
        _.each(vehicleLogsWs, (msg, vehicleId) => {
            const usergroup = _.get(msg, 'VehicleUserGroup', null);
            const vehicleLogs = _.get(vehicleLogsByUserGroup, usergroup, []);
            vehicleLogs.push(msg);
            vehicleLogsByUserGroup[usergroup] = vehicleLogs;

            vehicleLogsWs = _.omit(vehicleLogsWs, vehicleId); // remove log from ws list
        });

        // send websocket message at once
        _.each(vehicleLogsByUserGroup, (vehicleLogs, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('create')
                .setContent(vehicleLogs)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });
    }
};

async function createVehicleLocationLog(req, logs) {
    log.trace('createVehicleLocationLog', req.user.username);

    const mostRecent = {};

    logs = vrpUtils.toArray(logs);
    _.remove(logs, (vehicleLog) => {
        // validate vehicle log
        if (!isVehicleLogValid(vehicleLog)) {
            log.debug('Vehicle log error', vehicleLog);
            return true;
        }

        // structure object to save into mongodb
        const socketMsg = _.clone(vehicleLog);
        vehicleLog = {
            VehicleId: vehicleLog.VehicleId,
            VehicleUserGroup: vehicleLog.VehicleUserGroup,
            DriverName: vehicleLog.DriverName,
            PlateNumber: vehicleLog.PlateNumber,
            Coordinates: [vehicleLog.Lng, vehicleLog.Lat],
            Accuracy: vehicleLog.Accuracy,
            RecordedTime: vehicleLog.RecordedTime,
            CreatedBy: _.get(req.user, 'fullname', 'username'),
        };

        // check if this current log is even later than the previous one
        // used for updating vehiclelastseen collection
        const lastLastSeenLog = mostRecent[vehicleLog.VehicleId];
        if (_.isNil(lastLastSeenLog) || moment(vehicleLog.RecordedTime).isAfter(moment(lastLastSeenLog.RecordedTime))) {
            mostRecent[vehicleLog.VehicleId] = vehicleLog;

            // check if this current log is even later than the current websocket message queue
            // used for sending websocket message
            const lastWsLog = vehicleLogsWs[vehicleLog.VehicleId];
            if (_.isNil(lastWsLog) || moment(vehicleLog.RecordedTime).isAfter(moment(lastWsLog.RecordedTime))) {
                // generate object for websocket
                vehicleLogsWs[vehicleLog.VehicleId] = socketMsg;
            }
        }
    });

    // update vehiclelastseen collection, errors not returned as response
    updateMostRecent(mostRecent);

    if (logs.length > 0) {
        try {
            const result = await colVehicleLocationLog.insertMany(logs);

            let insertedCount = 0;
            if (!_.isNil(result)) {
                insertedCount = _.get(result, 'result.n');
                log.trace(`Inserted ${insertedCount} vehicle locations`);
            }
            return insertedCount;
        } catch (err) {
            log.warn('Unable to insert location logs', err);
            throw err;
        }
    }

    function isVehicleLogValid(vehicleLog) {
        if (_.isEmpty(vehicleLog)) {
            vehicleLog.error = 'Vehicle Log is empty.';

        } else {
            vehicleLog.RecordedTime = _.isNil(vehicleLog.RecordedTime) ? moment() : vehicleLog.RecordedTime;
            vehicleLog.RecordedTime = moment(vehicleLog.RecordedTime).toDate(); // convert to Date object to store correctly in mongodb
            vehicleLog.DriverName = _.isNil(vehicleLog.DriverName) ? _.get(req, 'user.fullname', null) : vehicleLog.DriverName;
            vehicleLog.Accuracy = _.isNil(vehicleLog.Accuracy) ? null : _.toNumber(vehicleLog.Accuracy);
            vehicleLog.Lng = _.isNil(vehicleLog.Lng) ? null : _.toNumber(vehicleLog.Lng);
            vehicleLog.Lat = _.isNil(vehicleLog.Lat) ? null : _.toNumber(vehicleLog.Lat);
            vehicleLog.VehicleUserGroup = _.isNil(vehicleLog.VehicleUserGroup) ? null : vehicleLog.VehicleUserGroup;
            vehicleLog.PlateNumber = _.isNil(vehicleLog.PlateNumber) ? null : vehicleLog.PlateNumber;

            if (_.isNil(vehicleLog.VehicleId)) {
                vehicleLog.error = 'VehicleId is missing.';

            } else if (_.size(vehicleLog.VehicleId) > 50) {
                vehicleLog.error = `Invalid VehicleId ${vehicleLog.VehicleId}. Maximum 50 characters.`;

            } else if (_.size(vehicleLog.PlateNumber) > 10) {
                vehicleLog.error = `Invalid PlateNumber ${vehicleLog.PlateNumber}. Maximum 10 characters.`;

            } else if (!vrpMapUtils.isLatLonValid(vehicleLog.Lat, vehicleLog.Lng)) {
                vehicleLog.error = `Invalid Latitude ${vehicleLog.Lat} / Longitude ${vehicleLog.Lng}`;

            } else if (_.size(vehicleLog.DriverName) > 100) {
                vehicleLog.error = `DriverName ${vehicleLog.DriverName} cannot have more than 100 characters.`;

            } else if (moment(vehicleLog.RecordedTime).isAfter(moment().add('10', 'minute'))) {
                vehicleLog.error = 'RecordedTime is invalid (> 10 minutes from server time).';

            } else if (_.size(vehicleLog.VehicleUserGroup) > 100) {
                vehicleLog.error = `Invalid VehicleUserGroup ${vehicleLog.VehicleUserGroup}. Maximum 100 characters.`;
            }
        }

        if (_.has(vehicleLog, 'error')) {
            log.trace('Vehicle log error', vehicleLog.error);
        }
        return !_.has(vehicleLog, 'error');
    }

    function updateMostRecent(mostRecentLogs) {
        _.each(mostRecentLogs, async (recentLog) => {
            try {
                // check if the collection already exists a record that is more updated
                const moreRecentRecordExists = await colVehicleLastSeen.findOne({
                    VehicleId: recentLog.VehicleId,
                    RecordedTime: {
                        $gt: recentLog.RecordedTime,
                    },
                });

                if (_.isNil(moreRecentRecordExists)) {
                    // update collection with updated record
                    const result = await colVehicleLastSeen.updateOne({
                        VehicleId: recentLog.VehicleId,
                    }, {
                        $set: recentLog,
                    }, {
                        upsert: true,
                    });

                    if (_.get(result, 'result.n') < 0) {
                        throw new Error('Unable to update most recent location');
                    }
                }
            } catch (err) {
                log.trace(err);
            }
        });
    }
}
