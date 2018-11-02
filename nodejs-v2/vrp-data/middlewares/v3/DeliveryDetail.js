/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const vrpUtils = require('../../../vrp-common/utils');
const vrpConfig = require('../../../configuration');

const OFFLINE_FILES_FOLDER = vrpConfig.get('features.offlineSync.folder');

exports.m_attemptJobBase64 = imageBase64ToBuffer({
    fields: [{
        name: 'signature',
        maxCount: 1,
    }, {
        name: 'notePhotos',
        maxCount: 3,
    }, {
        name: 'photo',
        maxCount: 1,
    }],
});

exports.m_offlineJobBase64 = imageBase64ToBuffer({
    storage: OFFLINE_FILES_FOLDER,
    fields: [{
        name: 'signature',
        maxCount: 1,
    }, {
        name: 'notePhotos',
        maxCount: 3,
    }, {
        name: 'photo',
        maxCount: 1,
    }],
});

/**
 * Save images in base64 into jpg files or buffer. Response is the same as multer's
 *
 * @param {Object} options  todo
 * @param {String} [options.storage]  Path on disk to store files
 * @param {any[]} options.fields  List of fields with values in base64 string
 * @param {Number} options.fields.name  Property name of the field in req.body
 * @param {Number} options.fields.maxCount  Indicates the maximum number of base64 expected
 * @returns {void}
 */
function imageBase64ToBuffer(options) {
    return async (req, res, next) => {
        const storage = options.storage;
        const fields = options.fields;
        const bodyIsArray = _.isArray(req.body);

        try {
            // initialise req.files
            req.files = (bodyIsArray) ? [] : {};

            await Promise.all(_.map(vrpUtils.toArray(req.body), (body, i) => {
                return Promise.each(fields, (field) => {
                    const data = body[field.name];
                    if (_.isEmpty(data)) {
                        return; // skip
                    }

                    const file = {
                        fieldname: (bodyIsArray) ? `${i}[${field.name}]` : field.name,
                        mimetype: 'image/jpeg',
                    };

                    if (storage) {
                        file.destination = storage;
                    }

                    // remove fields that have been processed
                    if (bodyIsArray) {
                        req.body[i] = _.omit(req.body[i], [field.name]);
                    } else {
                        req.body = _.omit(req.body, [field.name]);
                    }

                    if (_.isArray(data)) {
                        return Promise.each(data, (base64) => saveBase64(base64, file).then((result) => addFile(field.name, result)));
                    } else {
                        return saveBase64(data, file).then((result) => addFile(field.name, result));
                    }
                });
            }));

            next();
        } catch (err) {
            next(err);
        }

        /**
		 * Save buffer into list
		 *
		 * @param {String} property  Original field name (i.e. without brackets)
		 * @param {*} file  todo
 		 * @returns {void}
		 */
        function addFile(property, file) {
            if (bodyIsArray) {
                req.files.push(file);
            } else {
                req.files[property] = (_.isEmpty(req.files[property])) ? [] : req.files[property]; // initialise
                req.files[property].push(file);
            }
        }
    };
}

/**
 *
 * @param {*} base64  todo
 * @param {*} file  todo
 * @param {String} file.destination  todo
 * @param {String} file.fieldname  todo
 * @returns {void}
 */
async function saveBase64(base64, file) {
    const buffer = vrpUtils.base64ToBuffer(base64);
    if (_.isEmpty(file.destination)) {
        // no need to store on disk
        // signature: [{
        // 	fieldname: 'signature',
        // 	originalname: 'signature.png', // not used
        // 	mimetype: 'image/png',
        // 	buffer: < Buffer > ,
        // 	size: 14041 // not used
        // }],
        return Object.assign({ buffer: buffer }, file);
    } else {
        // store in disk
        const filename = vrpUtils.getFileName(file.fieldname, 'jpg');
        const filePath = `${file.destination}/${filename}`;

        try {
            await vrpUtils.saveFile(buffer, filePath);

            // [{
            // 	fieldname: '0[notePhotos]',
            // 	originalname: 'photo.jpg', // not used
            // 	encoding: '7bit', // not used
            // 	mimetype: 'image/jpeg',
            // 	destination: 'data/offline_files',
            // 	filename: '05252018_0954_photo.jpg.6cddc9e178.jpeg',
            // 	path: 'data\\offline_files\\05252018_0954_photo.jpg.6cddc9e178.jpeg',
            // 	size: 74155 // not used
            // }],
            return Object.assign({ filename: filename, path: filePath }, file);
        } catch (err) {
            throw err;
        }
    }
}
