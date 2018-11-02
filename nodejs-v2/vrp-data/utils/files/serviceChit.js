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
const PdfPrinter = require('pdfmake');
const { JOB } = require('../../classes');
const vrpEnum = require('../../../enum');
const vrpUtils = require('../../../vrp-common/utils');
const vrpConfig = require('../../../configuration');

const VALUES = vrpConfig.get('features.notifyServiceChit.values');
const IMAGE_EXT = 'jpg';

const LOGO = _getPdfLogo();
const FONT_DESCRIPTORS = new PdfPrinter({
    Roboto: {
        normal: `${__dirname}/fonts/Roboto-Regular.ttf`,
        bold: `${__dirname}/fonts/Roboto-Medium.ttf`,
        italics: `${__dirname}/fonts/Roboto-Italic.ttf`,
        bolditalics: `${__dirname}/fonts/Roboto-MediumItalic.ttf`,
    },
});

/**
 * Generate service chit
 *
 * @param {object} job  Instance from DeliveryDetail table
 * @param {buffer|string} podSignature  Proof of delivery (signature) either in buffer or base64
 * @returns {buffer}  Zip file
 */
module.exports = function serviceChit(job, podSignature) {
    log.trace(`<ServiceChit> Id ${job.Id}, DeliveryMasterId ${job.DeliveryMasterId}`);

    if (JOB.isCompleted(job) === false) {
        return Promise.reject(`<ServiceChit> Job ${job.Id} is not completed.`);

    } else if (_.isNil(podSignature)) {
        return Promise.reject(`<ServiceChit> Job ${job.Id} POD signature is missing.`);

    }

    // convert signature into base64 if necessary
    const base64Signature = _photoToBase64(podSignature);

    // PDF definition (refer to `pdfmake` library)
    const docDefinition = {
        footer: (page, pages) => ({
            columns: [{
                alignment: 'right',
                text: [
                    'page ',
                    {
                        text: page.toString(),
                        italics: true,
                    },
                    ' of ',
                    {
                        text: pages.toString(),
                        italics: true,
                    },
                ],
            }],
            fontSize: 8,
            margin: [20, 0],
        }),
        content: [{
            columns: [{
                width: 'auto',
                stack: [LOGO],
            },
            [{
                text: `${VALUES.companyName}`,
                style: 'pageHeader',
            },
            {
                text: [{
                    text: `${VALUES.companyAddress}`,
                    style: 'pageSubheader',
                },
                {
                    text: `\n${VALUES.companyContact}`,
                    style: 'pageSubheader',
                },
                {
                    text: `\n${VALUES.companyEmail}`,
                    style: 'pageSubheader',
                },
                ],
            },
            ],
            ],
        }, {
            margin: [0, 20],
            table: {
                widths: ['*', '*', '*', '*'],
                body: [
                    [{
                        text: 'Date',
                        style: 'tableHeader',
                    }, {
                        text: moment(_.get(job, 'ActualDeliveryTime')).format(vrpEnum.DateFormat.DISPLAY_TEXT),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Driver',
                        style: 'tableHeader',
                    }, {
                        text: getJobValue(job, 'DeliveryMaster.LastAttemptedByDriver'),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Customer',
                        style: 'tableHeader',
                    }, {
                        text: getJobValue(job, 'DeliveryMaster.CustomerName'),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Location',
                        style: 'tableHeader',
                    }, {
                        text: `${getJobValue(job, 'Address')}\n${getJobValue(job, 'Postal')}`,
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Type',
                        style: 'tableHeader',
                    }, {
                        text: getJobValue(job, 'JobType'),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Items',
                        style: 'tableHeader',
                    }, {
                        ul: _.map(_.get(job, 'DeliveryItems'), (item) => {
                            const itemName = _.get(item, 'ItemId');
                            const qty = _.toNumber(_.get(item, 'ActualItemQty', 0));
                            return `Number of ${itemName}: ${qty}`;
                        }),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Remarks',
                        style: 'tableHeader',
                    }, {
                        text: JOB.noteColumnToString(_.get(job, 'NoteFromDriver'), '\n'),
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                    [{
                        text: 'Customer Signature',
                        style: 'tableHeader',
                    }, {
                        stack: [{
                            image: base64Signature,
                            fit: [90, 90],
                        }],
                        style: 'tableContent',
                        colSpan: 3,
                    }],
                ],
            },
            layout: {
                hLineWidth: (i, node) => {
                    return (i === 0 || i === node.table.body.length) ? 2 : 1;
                },
                vLineWidth: (i, node) => {
                    return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                },
                hLineColor: (i, node) => {
                    return (i === 0 || i === node.table.body.length) ? 'black' : '#3f3f3f';
                },
                vLineColor: (i, node) => {
                    return (i === 0 || i === node.table.widths.length) ? 'black' : '#3f3f3f';
                },
            },
        }],
        styles: {
            pageHeader: {
                fontSize: 16,
                bold: true,
                italics: true,
                alignment: 'right',
            },
            pageSubheader: {
                fontSize: 11,
                alignment: 'right',
                margin: [20, 30],
            },
            tableHeader: {
                margin: [5, 10],
                fontSize: 13,
                alignment: 'center',
                bold: true,
            },
            tableContent: {
                margin: [5, 10],
                fontSize: 13,
            },
        },
        defaultStyle: {
            fontSize: 11,
            columnGap: 20,
        },
    };

    return new Promise((resolve, reject) => {
        const pdfDoc = FONT_DESCRIPTORS.createPdfKitDocument(docDefinition);

        const chunks = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
    });
};

/**
 * Get value from `job` object based on property key.
 * If value is null or undefined, '-' will be returned.
 * Lodash `_.get(obj, key, default)` cannot be used because default will not be used if obj[key]
 * is null.
 * @param {Object} job  Instance of DeliveryDetail table
 * @param {String} key  Column name of DeliveryDetail table
 * @returns {Object}  Column value
 */
function getJobValue(job, key) {
    let value = _.get(job, key, '-');
    if (_.isNil(value)) {
        value = '-';
    }
    return value;
}

/**
 * Generate configuration for logo section based on user settings
 * @returns {Object}  Configuration for logo
 */
function _getPdfLogo() {
    const logoConfig = VALUES.companyLogo;
    if (logoConfig.text) {
        return {
            text: logoConfig.text,
        };
    } else if (logoConfig.image) {
        return {
            image: logoConfig.image,
            fit: logoConfig.size,
        };
    }
}

/**
 * Encode photo into Base64 if necessary
 * If `photo` is already a Base64, ensure the string is prefixed with `data:image/...`
 * @param {String|Buffer} photo  Photo in Base64 string or buffer
 * @returns {String}  Base64 string with data URI
 */
function _photoToBase64(photo) {
    let base64 = photo; // assume photo is base64
    if (Buffer.isBuffer(photo) === true) {
        // if photo is not base64, convert to base64
        base64 = vrpUtils.bufferToBase64(photo);
    }
    if (_.startsWith(base64, 'data:image') === false) {
        // prepend data uri to base64 string
        base64 = `data:image/${IMAGE_EXT};base64,${base64}`;
    }
    return base64;
}
