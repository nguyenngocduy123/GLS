/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Cron');

const moment = require('moment');
const schedule = require('node-schedule');
const mail = require('./utils/mail');
const tasks = require('./utils/tasks');
const VehicleLocationLog = require('./middlewares/VehicleLocationLog');
const vrpConfig = require('../configuration');

// update jobs expected to be late status
(function _checkExpectLateStatus() {
    const expression = _intervalToCronExpression(vrpConfig.get('features.expectLate.checkInterval'));
    schedule.scheduleJob(expression, tasks.updateExpectedToBeLate);
    log.info(`CheckExpectLateStatus schedule will run at ${expression}`);
})();

// send vehicle location log websocket message at an interval
(function _notifyVehicleLog() {
    const expression = _intervalToCronExpression(vrpConfig.get('websocket.vehicleLog'));
    schedule.scheduleJob(expression, VehicleLocationLog.sendSocketMessages);
    log.info(`VehicleLocationLog schedule will run at every ${expression}`);
})();

// send verification code notification email daily at fixed timing
(function _notifyVerificationCode() {
    const feature = vrpConfig.get('features.notifyVerificationCode');
    if (!feature.enable) {
        return log.warn('VerificationCode schedule is not enabled.');
    }
    const expression = _timeToCronExpression(feature.daily);
    schedule.scheduleJob(expression, tasks.dailyVerificationCode);
    log.info(`VerificationCode schedule will run at every ${expression}`);
})();

// send notification to planners to notify of late or unsuccessful orders
(function _notifyJobDone() {
    const feature = vrpConfig.get('features.notifyOrderDone');
    if (!feature.enable) {
        return log.warn('PlannerNotification schedule is not enabled.');
    }
    const expression = _intervalToCronExpression(feature.mailInterval);
    schedule.scheduleJob(expression, mail.sendPlannerNotification);
    log.info(`NotifyJobComplete schedule will run at every ${expression}`);
})();

/**
 * Convert interval in seconds to cron expression
 * @param {String|Number} intervalInSeconds  Interval value in seconds
 * @returns {String}  Cron expression for interval
 */
function _intervalToCronExpression(intervalInSeconds) {
    const interval = Number(intervalInSeconds);
    if (Number.isNaN(interval)) {
        return log.error(`Interval ${interval} is not valid number`);
    }
    return `*/${intervalInSeconds} * * * * *`;
}

/**
 * Convert time in 24-hour format to cron expression
 * @param {String} time  Time in 24-hour format (HHmm)
 * @returns {String}  Cron expression for fixed daily schedule
 */
function _timeToCronExpression(time) {
    const momentTime = moment(time, 'HHmm');
    if (!momentTime.isValid()) {
        return log.error(`Time ${time} is not in 24-hour format`);
    }
    return `${momentTime.format('mm')} ${momentTime.format('HH')} * * *`;
}
