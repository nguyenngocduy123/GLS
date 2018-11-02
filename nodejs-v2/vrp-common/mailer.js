/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Mailer');

const _ = require('lodash');
const nodemailer = require('nodemailer');
const vrpConfig = require('../configuration');
const vrpUtils = require('../vrp-common/utils');
const transporter = nodemailer.createTransport(vrpConfig.get('mail.config'));

const MAIL_CONTENT = vrpConfig.get('mail.content');

(async function _init() {
    try {
        await transporter.verify();
        log.info('Verified mail server');
    } catch (err) {
        log.warn('Fail to connect to mail server', JSON.stringify(transporter.options));
    }
})();

/**
 * Send email to email addresses
 * @param {Object} options  Email content configurations
 * @param {Array|String} options.to  List of addresses to send the email to
 * @param {String} options.subject  Subject of the email
 * @param {String} options.html  Content of the email, HTML is supported
 * @param {Boolean} [options.disableReply=false]  Indicates whether to inform receiver that email was computer-generated (i.e. do not reply)
 * @param {Array} [options.attachments]  List of attachments
 * @param {String} options.attachments.filename  Rename the attachment to this name
 * @param {String} options.attachments.path  Path to attachment
 * @example
 *      sendEmail({
 *          to: 'simtech.pom.msa@gmail.com',
 *          subject: 'Test',
 *          html: 'Sent successfully',
 *          attachments:[{
 *              filename: 'testAttachment.json',
 *              path: './test/tmp/upload-this-file.json'
 *          }]
 *      });
 * @returns {Promise<void>}  todo
 */
exports.sendEmail = async (options) => {
    // add default cc list
    options.cc = vrpUtils.toArray(options.cc, MAIL_CONTENT.cc);

    // set return email address if reply is allowed
    options.replyTo = (options.disableReply) ? null : MAIL_CONTENT.reply;

    options.subject = `${MAIL_CONTENT.subjectPrefix} ${options.subject}`;

    // generate email footer
    if (_.isEmpty(options.replyTo)) {
        options.html += `
            <p>----</p>
            <p>This is a computer-generated email. <strong>Do not reply.</strong>
            <br>For any enquiries, please contact the company or person-in-charge directly.<br></p>`;
    }

    try {
        const info = await transporter.sendMail(options);
        log.trace('Sent email successfully', info.messageId);
        return true;
    } catch (err) {
        throw err;
    }
};
