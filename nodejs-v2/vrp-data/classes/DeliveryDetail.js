/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const moment = require('moment');
const vrpUtils = require('../../vrp-common/utils');
const vrpConfig = require('../../configuration');

// References local variable to role property in user collection
exports.STATUS = {
    PENDING: 1,
    LATE: 2,
    ONTIME: 3,
    UNSUCCESSFUL: 4,
    EXPECTED_TO_BE_LATE: 5,
};
const status = exports.STATUS;

exports.TYPE = {
    DELIVERY: 'DELIVERY',
    PICKUP: 'PICKUP',
};
const jobtype = exports.TYPE;

/**
 * Get a readable label / text based on a job's status. To be used for (e.g.) transaction logs.
 * @param {object} job  Instance of DeliveryDetail table
 * @param {object} job.Status  todo
 * @returns {String}  todo
 */
exports.getStatusLabel = (job) => {
    if (exports.isPending(job)) {
        return 'PENDING';

    } else if (exports.isOntime(job)) {
        return 'ONTIME';

    } else if (exports.isLate(job)) {
        return 'LATE';

    } else if (exports.isUnsuccessful(job)) {
        return 'UNSUCCESSFUL';

    } else {
        return 'UNKNOWN';
    }
};

/**
 * Check if a job is of a certain job status.
 *
 * @param {object} job  Instance of DeliveryDetail table
 * @param {object} job.Status  todo
 * @returns {Boolean}  todo
 */
exports.isExpectedToBeLate = (job) => _.get(job, 'Status') === status.EXPECTED_TO_BE_LATE;
exports.isPending = (job) => _.get(job, 'Status') === status.PENDING || exports.isExpectedToBeLate(job);
exports.isOntime = (job) => _.get(job, 'Status') === status.ONTIME;
exports.isLate = (job) => _.get(job, 'Status') === status.LATE;
exports.isUnsuccessful = (job) => _.get(job, 'Status') === status.UNSUCCESSFUL;
exports.isCompleted = (job) => exports.isOntime(job) || exports.isLate(job);

/**
 * Check if a job is of a certain job type.
 *
 * @param {object} job  Instance of DeliveryDetail table
 * @param {object} job.JobType  todo
 * @returns {Boolean}  todo
 */
exports.isPickup = (job) => vrpUtils.isSameText(_.get(job, 'JobType'), jobtype.PICKUP);
exports.isDelivery = (job) => vrpUtils.isSameText(_.get(job, 'JobType'), jobtype.DELIVERY);

/**
 * Check if a driver is allowed to do a job
 * `user` can be taken from `req.user` in passport.
 *
 * @param {object} job  Instance of DeliveryDetail table with Vehicle table eager-loaded
 * @param {object} user  todo
 * @param {object} user.username  todo
 * @returns {Boolean}  todo
 */
exports.isCorrectDriver = (job, user) => {
    const correctDriver = _.get(job, 'DeliveryMaster.Vehicle.DriverUsername');
    return vrpUtils.isSameText(_.get(user, 'username'), correctDriver);
};

/**
 * Check if a job requires proof of delivery, either in signature or photo format
 *
 * @param {object} job  Instance of DeliveryDetail table
 * @returns {Boolean}  todo
 */
exports.requirePodSignature = (job) => exports.isUnsuccessful(job) === false;
exports.requirePodPhoto = () => vrpConfig.get('driverApp.pod.photo.required');

/**
 * Calculate job status based on delivery time
 *
 * @param {object} job  Instance of DeliveryDetail table
 * @param {Boolean} delivered  Whether the job was delivered successfully
 * @param {Date|moment|string} deliveryTimeAt  Time of delivery
 * @returns {STATUS}  todo
 */
exports.generateStatus = (job, delivered, deliveryTimeAt) => {
    let jobStatus = status.ONTIME;
    if (vrpUtils.toBoolean(delivered) === false) {
        jobStatus = status.UNSUCCESSFUL;
    } else if (moment(deliveryTimeAt).isAfter(job.EndTimeWindow)) {
        jobStatus = status.LATE;
    }
    return jobStatus;
};

/**
 * Convert values in Note columns from DeliveryDetail table
 * Note columns are (e.g.) NoteFromPlanner and NoteFromDriver.
 *
 * @param {object[]} notes  Note columns from DeliveryDetail table
 * @param {object} note[].key  todo
 * @param {object} note[].value  todo
 * @param {String} [delimiter=',']  Delimiter in between note pairs
 * @returns {String}  todo
 */
exports.noteColumnToString = (notes, delimiter) => {
    delimiter = _.isEmpty(delimiter) ? ', ' : delimiter;
    const noteArr = _.map(notes, (pairing) => {
        const key = _.get(pairing, 'key');

        let value = _.get(pairing, 'value');
        if (_.isObject(value)) {
            value = _.join(_.map(value, (nestedVal, nestedKey) => `(${nestedKey}) ${nestedVal}`));
        }
        return `${key}: ${value || '-'}`;
    });
    return _.join(noteArr, delimiter);
};
