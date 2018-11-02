/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/** Purpose: standardise email subject and contents. There should be
 *  no validation checks in this file since it is meant for templating only. */

const _ = require('lodash');
const moment = require('moment');
const handlebars = require('handlebars');
const { JOB } = require('../../../classes');
const vrpEnum = require('../../../../enum');
const vrpUtils = require('../../../../vrp-common/utils');

/**
 * @typedef {object} email
 * @property {String} subject  Subject of email
 * @property {String} html  Contents of email in HTML
 */

/**
 * Generate email template for notifying verification code
 *
 * @param {object} job  Instance from DeliveryDetail table with VerificationCode table eager-loaded
 * @returns {Promise<email>}  todo
 */
exports.verificationCode = async (job) => {
    const email = {};
    email.subject = `Verification Code for #${job.DeliveryMasterId}`;
    email.html = '';
    email.disableReply = true;

    // get email template in html
    const templatePath = `${__dirname}/verificationCode.html`;

    try {
        const html = await vrpUtils.readFile(templatePath, true);

        // fill in contents of email template
        const htmlTemplate = handlebars.compile(html);
        // only pass necessary data to html
        const contactName = _.isNil(_.get(job, 'ContactName')) ? 'Sir or Madam' : job.ContactName;
        const replacements = {
            orderId: _.get(job, 'DeliveryMasterId'),
            jobType: _.get(job, 'JobType'),
            code: _.get(job, 'VerificationCode.Code'),
            contactName: contactName,
        };
        email.html += htmlTemplate(replacements);
        return email;
    } catch (err) {
        throw new Error(`Missing email template at ${templatePath}`);
    }
};

/**
 * Generate email template for service chit emails
 *
 * @param {object} job  Instance from DeliveryDetail table
 * @returns {Promise<email>}  todo
 */
exports.serviceChit = async (job) => {
    const email = {};
    email.subject = `Service Chit for #${job.DeliveryMasterId}`;
    email.html = '';
    email.disableReply = true;

    // get email template in html
    const templatePath = `${__dirname}/serviceChit.html`;
    try {
        const html = await vrpUtils.readFile(templatePath, true);

        // fill in contents of email template
        const htmlTemplate = handlebars.compile(html);
        // only pass necessary data to html
        const customerName = _.isNil(_.get(job, 'DeliveryMaster.CustomerName')) ? 'Sir or Madam' : job.DeliveryMaster.CustomerName;
        const replacements = {
            orderId: _.get(job, 'DeliveryMasterId'),
            jobType: _.get(job, 'JobType'),
            customerName: customerName,
        };
        email.html += htmlTemplate(replacements);
        return email;
    } catch (err) {
        throw new Error(`Missing email template at ${templatePath}`);
    }
};

/**
 * @typedef {object[]} emailJobList
 * @property {object} job  Instance from DeliveryDetail table.
 * @property {object[]} affectedJobs  Instance(s) from DeliveryDetail table. List of jobs that
 *                                    were affected by `job`
 */
/**
 * Generate email template to send as planner notification for late/unsuccessful
 * jobs
 *
 * @param {emailJobList} jobsList  Array of instance(s) from DeliveryDetail table
 * @returns {Promise<email>}  todo
 */
exports.plannerNotification = async (jobsList) => {
    const email = {};
    email.subject = 'Unsuccessful/Late Job Notification';
    email.html = '';
    email.disableReply = true;

    // get email template in html
    const templatePath = `${__dirname}/plannerNotification.html`;
    try {
        const html = await vrpUtils.readFile(templatePath, true);

        // fill in contents of email template
        const htmlTemplate = handlebars.compile(html);
        _.each(jobsList, (list) => {
            const jobs = _.flatten([list.job, vrpUtils.toArray(list.affectedJobs)]);

            // only pass necessary data to html
            const replacements = {
                orderId: _.get(list.job, 'DeliveryMasterId'),
                hasAffectedJob: (list.affectedJobs.length > 0),
                jobs: _.map(jobs, (job) => ({
                    JobType: job.JobType,
                    Status: JOB.getStatusLabel(job),
                    ActualDeliveryTime: moment(job.ActualDeliveryTime).format(vrpEnum.DateFormat.DISPLAY_TEXT),
                    StartTimeWindow: moment(job.StartTimeWindow).format(vrpEnum.DateFormat.DISPLAY_TEXT),
                    EndTimeWindow: moment(job.EndTimeWindow).format(vrpEnum.DateFormat.DISPLAY_TEXT),
                    Address: job.Address,
                    Postal: job.Postal,
                    NoteFromDriver: JOB.noteColumnToString(job.NoteFromDriver, '<br>'),
                    VehicleId: _.get(job, 'DeliveryMaster.VehicleId'),
                    LastAttemptedByDriver: _.get(job, 'DeliveryMaster.LastAttemptedByDriver'),
                    LastAttemptedByPlateNumber: _.get(job, 'DeliveryMaster.LastAttemptedByPlateNumber'),
                })),
            };
            email.html += htmlTemplate(replacements);
        });
        return email;
    } catch (err) {
        throw new Error(`Missing email template at ${templatePath}`);
    }
};
