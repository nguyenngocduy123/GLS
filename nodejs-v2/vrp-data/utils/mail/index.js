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
const Promise = require('bluebird');
const { JOB } = require('../../classes');
const files = require('../../utils/files');
const template = require('./template');
const vrpSql = require('../../../vrp-sql');
const vrpUser = require('../../../vrp-user/user');
const vrpEnum = require('../../../enum');
const vrpMailer = require('../../../vrp-common/mailer');
const vrpUtils = require('../../../vrp-common/utils');
const vrpUserUtils = require('../../../vrp-user/user-utils');
const vrpConfig = require('../../../configuration');

const VERIFICATION_CODE_ENABLED = vrpConfig.get('features.notifyVerificationCode.enable');
const SERVICE_CHIT_ENABLED = vrpConfig.get('features.notifyServiceChit.enable');
const PLANNER_NOTIFICATION_ENABLED = vrpConfig.get('features.notifyOrderDone.enable');

/**
 * Send verification code email
 *
 * @param {number|number[]} jobIds  Id column of DeliveryDetail table
 * @returns {Promise<void>}  Throws array of errors (if any)
 */
exports.verificationCode = async (jobIds) => {
    try {
        if (VERIFICATION_CODE_ENABLED === false) {
            const error = new Error('<VerificationCode> Feature not enabled.');
            error.name = 'FeatureNotEnabled';
            throw error;
        }

        log.trace(`<VerificationCode> Sending for ${jobIds}`);

        const dbRecords = await vrpSql.DeliveryDetail.scope([{ method: ['primaryKey', jobIds] }]).findAll({
            where: {
                ContactEmail: {
                    [vrpSql.sequelize.Op.not]: null,
                },
            },
            include: [{
                model: vrpSql.VerificationCode,
                where: {
                    Code: {
                        [vrpSql.sequelize.Op.not]: null,
                    },
                },
            }],
        });

        // do not throw errors so that all promises resolve to ensure all emails are sent
        const errIfAny = await Promise.map(dbRecords, (job) => {
            return template.verificationCode(job).then((email) => {
                email.to = job.ContactEmail;
                return vrpMailer.sendEmail(email).then(() => { });
            }).catch((err) => {
                return `Job ${job.Id}. ${err}`;
            });
        });

        const errorList = _.compact(errIfAny);
        if (!_.isEmpty(errorList)) {
            throw errorList; // throw all errors encountered
        }
    } catch (err) {
        throw err;
    }
};

/**
 * Send service chit to customer's email.
 * Customer's email is based on CustomerEmail column in DeliveryMaster table.
 *
 * @param {object} job  Instance from DeliveryDetail table with DeliveryMaster table eager-loaded
 * @param {Object} podSignature  todo
 * @returns {Promise<void>}  Throws error (if any)
 */
exports.serviceChit = async (job, podSignature) => {
    try {
        if (SERVICE_CHIT_ENABLED === false) {
            const error = new Error('<ServiceChit> Feature not enabled.');
            error.name = 'FeatureNotEnabled';
            throw error;

        } else if (_.isEmpty(_.get(job, 'DeliveryMaster.CustomerEmail'))) {
            throw new Error(`<ServiceChit> No customer email for order ${job.DeliveryMasterId} (${job.JobType})`);
        }

        log.trace(`<ServiceChit> Sending for ${job.Id}`);

        const [email, pdf] = await Promise.all([
            template.serviceChit(job), // get email template
            files.serviceChit(job, podSignature), // generate service chit in pdf
        ]);

        email.to = job.DeliveryMaster.CustomerEmail;
        email.attachments = [{
            filename: `servicechit_${job.DeliveryMasterId}_${_.toLower(job.JobType)}.pdf`,
            content: pdf,
        }];

        return await vrpMailer.sendEmail(email);
    } catch (err) {
        throw err;
    }
};

/**
 * Stores list of late/unsuccessful jobs to send as emails to planner
 * @typedef {object[]} jobsToNotify
 * @property {object} job  Instance from DeliveryDetail table with DeliveryMaster table eager-loaded
 * @property {object[]} affectedJobs  Instance(s) from DeliveryDetail table. List of jobs that
 *                                    were affected by `job`
 */
/** @type jobsToNotify */
let jobsToNotifyPlanner = [];

/**
 * Send email to planners to notify late or unsuccessful jobs.
 * Emails will be sent at an interval.
 *
 * @param {object} job  Instance from DeliveryDetail table with DeliveryMaster table eager-loaded
 * @param {object[]} [affectedJobs]  Instance(s) from DeliveryDetail table. List of jobs that
 *                                   were affected by `job`
 * @returns {void}
 */
exports.plannerNotification = (job, affectedJobs) => {
    try {
        const bufferTimeSecs = vrpConfig.get('features.notifyOrderDone.acceptedBuffer.late');

        if (PLANNER_NOTIFICATION_ENABLED === false) {
            const error = new Error('<PlannerNotification> Feature not enabled.');
            error.name = 'FeatureNotEnabled';
            throw error;
        }

        // no notification needed if the job is done within buffer time (even though actual time is late)
        const latestTimeBy = moment(_.get(job, 'EndTimeWindow')).add(bufferTimeSecs, 'seconds');
        const actualTime = moment(_.get(job, 'ActualDeliveryTime'));

        if (JOB.isLate(job) === false && JOB.isLate(job) === false) {
            const error = new Error('<PlannerNotification> Notification not required.');
            error.name = 'Ignore';
            throw error;
        } else if (JOB.isLate(job) === true && actualTime.isSameOrBefore(latestTimeBy)) {
            const error = new Error('<PlannerNotification> Job fulfilled within buffer time.');
            error.name = 'Ignore';
            throw error;
        }

        log.trace(`<PlannerNotification> Add job ${job.Id} to send email`);
        jobsToNotifyPlanner.push({
            job: job,
            affectedJobs: vrpUtils.toArray(affectedJobs),
        });
    } catch (err) {
        log.trace(err);
    }
};

/**
 * Actual function to send email. Should be invoked at an interval
 * @returns {void}
 */
exports.sendPlannerNotification = async () => {
    log.info(`<PlannerNotification> Sending ${jobsToNotifyPlanner.length} emails`);

    try {
        if (jobsToNotifyPlanner.length === 0) {
            return;
        }

        const plannerEmails = await getPlannerEmailAddress();
        const sendEmailPromise = await sendEmail(plannerEmails);
        log.info(`<PlannerNotification> ${jobsToNotifyPlanner.length} emails sent successfully`);
        return sendEmailPromise;
    } catch (err) {
        log.error(`<PlannerNotification> ${jobsToNotifyPlanner.length} emails not sent. Error:`, err);
    } finally {
        // regardless sent or not, set empty
        jobsToNotifyPlanner = [];
    }

    function getPlannerEmailAddress() {
        const req = { query: { roles: vrpEnum.UserRole.PLANNER }, answer: [] };
        return new Promise((resolve, reject) => {
            vrpUser.m_getUsers(req, null, (err) => {
                if (err) {
                    return reject(err);
                }

                const plannerEmails = _.reduce(req.answer, (list, user) => {
                    const email = _.get(user, 'email');
                    if (vrpUserUtils.isPlanner(user) && _.isEmpty(email) === false) {
                        list.push(email);
                    }
                    return list;
                }, []);

                if (_.isEmpty(plannerEmails)) {
                    reject('No planner emails to send to.');
                } else {
                    resolve(plannerEmails);
                }
            });
        });
    }

    function sendEmail(plannerEmails) {
        return template.plannerNotification(jobsToNotifyPlanner).then((email) => {
            email.to = plannerEmails;
            return vrpMailer.sendEmail(email);
        });
    }
};
