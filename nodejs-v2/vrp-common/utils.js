/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('vrpMain');

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');
const Promise = require('bluebird');
const vrpEnum = require('../enum');
const vrpSqlError = require('optional-require')(require)('../vrp-sql/error');

/**
 * Function to simulate stopwatch function
 * @returns {StopWatch}  Stopwatch functions
 */
exports.StopWatch = function StopWatch() {
    const _getNow = () => moment();

    let startTime = _getNow();

    /**
     * Start stopwatch
     * @returns {void}
     */
    this.start = () => {
        startTime = _getNow();
    };

    /**
     * Get the time when stop watch was started
     * @returns {Date}  Start time
     */
    this.getStartTime = () => startTime.toDate();

    /**
     * Get stop watch duration
     * @returns {String}  Duration in HH:mm:ss format
     */
    this.getDuration = () => {
        const endTime = _getNow();
        return moment.utc(moment.duration(endTime.diff(startTime)).asMilliseconds()).format('HH:mm:ss');
    };

    /**
     * Get stop watch duration in seconds
     * @returns {Number}  Duration in seconds
     */
    this.getDurationAsSeconds = () => {
        const endTime = _getNow();
        return moment.duration(endTime.diff(startTime)).asSeconds();
    };
};

/**
 * Compare two string text values to see if they are the same (case-insensitive).
 * @param {String} text1  Text value to compare
 * @param {String} text2  Text value to compare
 * @returns {Boolean}  `true` if both texts are the same
 */
exports.isSameText = (text1, text2) => (_normalizeText(text1) === _normalizeText(text2));

/**
 * Forms an array
 * @param {...any} val  Values to push into an array
 * @example
 *      toArray('123') // ['123]
 *      toArray([1], [2]) // [1, 2]
 *      toArray([null]) // []
 * @returns {any[]}  Array without falsy values (i.e. null, false, 0, undefined are purged)
 */
exports.toArray = (...val) => {
    return _.compact(_.concat(...val));
};

/**
 * Convert plain string text to boolean value if possible.
 * @param {String} text  todo
 * @param {Object} defaultValue  Default value if text is neither true nor false
 * @returns {Boolean}  Returns boolean value if `text` is a valid boolean. Otherwise, return `defaultValue` if specified or `null`.
 */
exports.toBoolean = (text, defaultValue) => {
    if (_normalizeText(text) === 'true') {
        return true;
    } else if (_normalizeText(text) === 'false') {
        return false;
    } else {
        return _.isNil(defaultValue) ? null : defaultValue;
    }
};

/**
 * Convert base64 string into buffer content.
 * @param {String} base64  Base64 string
 * @returns {Buffer}  Buffer content equivalent of `base64`. Returns `null` if `base64` is falsy.
 */
exports.base64ToBuffer = (base64) => {
    if (_.isNil(base64)) {
        return null;
    } else if (!_.isString(base64)) {
        throw new Error(`Base64 ${base64} must be in string`);
    } else {
        return Buffer.from(base64, 'base64');
    }
};

/**
 * Convert buffer content into base64 string.
 * @param {String|Buffer} buffer  Buffer content
 * @returns {String}  Base64 equivalent of `buffer`. Returns `buffer` if `base64` is falsy.
 */
exports.bufferToBase64 = (buffer) => {
    if (_.isNil(buffer)) {
        return null;
    } else if (!Buffer.isBuffer(buffer)) {
        throw new Error('Input is not a buffer type');
    } else {
        return Buffer.from(buffer, 'binary').toString('base64');
    }
};

/**
 * Test if a regex pattern exists in a string.
 * @param {String} regex  Regex pattern
 * @param {String} text  String to test regex pattern on
 * @returns {Boolean}  `true` if `text` fits the regex pattern
 */
exports.matchesRegex = (regex, text) => (new RegExp(regex)).test(text);

/**
 * Parse plain string text into JSON object and parse falsy values into null values. Nested
 * values are also parsed.
 * @param {any} text  Text to unserialize
 * @returns {String|any}
 *      Serialized text. If `text` is already an Object, function will return as is.
 *      If `text` is not a valid JSON, an error will be thrown.
 */
exports.unserialize = (text) => {
    // return object, null and undefined values as it is
    if (_.isNil(text) || _.isObjectLike(text)) {
        return text;
    } else if (text === '') {
        return null;
    }

    try {
        // convert string into JSON object
        const jsonObj = JSON.parse(text);
        return parse(jsonObj);
    } catch (err) {
        if (!_.isPlainObject(text)) {
            throw new Error('Invalid JSON object');
        }
        return text;
    }

    // do nested parsing to ensure nested values are also parsed
    function parse(obj) {
        _.each(obj, (value, key) => {
            if (value === 'null' || value === '') {
                obj[key] = null;
            } else if (value === 'undefined') {
                obj[key] = undefined;
            } else if (_.isString(value)) {
                obj[key] = value;
            } else {
                obj[key] = parse(value);
            }
        });
        return obj;
    }
};

/**
 * Generate a file name for consistency purposes.
 * @param {String} [purpose='untitled']  Purpose of file
 * @param {String} [fileExt='txt']  File extension of file
 * @returns {String}  Filename
 */
exports.getFileName = (purpose = 'untitled', fileExt = 'txt') => {
    const buffer = crypto.pseudoRandomBytes(5);
    const timeNow = moment().format(vrpEnum.DateFormat.FILE_SAFE).toString();
    return `${timeNow}_${purpose}.${buffer.toString('hex')}.${fileExt}`;
};

/**
 * Wrapper function to ensure the main function is only called once
 * @param {Object} thisContext  `fn` `this` context
 * @param {Function} fn  Main function to call
 * @return {Function}  Wrapper function
 */
exports.setupOnce = function setupOnce(thisContext, fn) {
    return (function closure() {
        let called = false;
        return function wrapper() {
            if (called) { return; } // stop execution

            called = true;
            fn.apply(thisContext, arguments);
        };
    })();
};

/**
 * Wrapper function to silent any errors
 * @param {Function} fn  Function to silence any errors that happen
 * @return {any}  Any result from `fn`
 */
exports.silenceError = (fn) => {
    return function wrapper() {
        try {
            return fn.apply(this, arguments);
        } catch (err) {
            log.warn('<Utils> Silent error', err);
        }
    };
};

/**
 * Convert error messages into a text that is safe to return to client. For example,
 * instead of returning errors from SQL queries directly, generate a text that is
 * generic to prevent any security breach.
 * @param {Error|String|Error[]|string[]} err  Error message
 * @param {Boolean} [withCode=true]  Indicates whether to print error message with error code
 * @returns {String|string[]}  Returns new error message. If `err` was an array, an array will be returned.
 */
exports.parseError = (err, withCode = true) => {
    const errorCode = withCode ? crypto.randomBytes(4).toString('hex') : null;

    if (err instanceof Promise.AggregateError) {
        // don't print stacks for aggregate errors
        log.error(`<Error> ${errorCode}`, err.map((message) => message.toString()));
    } else if (!(err instanceof Error) || err.name !== 'FeatureNotEnabled') {
        log.error(`<Error> ${errorCode}`, (_.get(err, 'parent') ? _.omit(err, 'parent') : err));
    }

    let errors;
    if (Array.isArray(err)) {
        errors = _.reduce(err, (list, message) => {
            list.push(parseMessage(errorCode, message));
            return list;
        }, []);
    } else if (err instanceof Promise.AggregateError) {
        errors = err.map((message) => parseMessage(errorCode, message));
    } else {
        errors = parseMessage(errorCode, err);
    }
    return { code: errorCode, errors: errors };

    /**
     * Parse error messages according to its type. If the error was from Sequelize,
     * it will return a safe string. Otherwise, a string of the error stack will be returned.
     *
     * @param {String} errorCode  Error code identifier
     * @param {String|Error} message   Error message
     * @returns {String}  Safe string
     */
    function parseMessage(errorCode, message) {
        let msgString = '';
        if (vrpSqlError && message instanceof vrpSqlError.TYPE) {
            msgString = vrpSqlError.getText(message);
        } else {
            msgString = _.isFunction(message.toString) ? message.toString() : message;
        }
        // append fullstop
        msgString = (_.endsWith(msgString, '.') || _.endsWith(msgString, '?')) ? msgString : `${msgString}.`;
        // determine whether to return with or without error code
        msgString = _.isNil(errorCode) ? msgString : `Error #${errorCode}: ${msgString}`;
        // prepend error header
        msgString = _.startsWith(msgString, 'Error') ? msgString : `Error: ${msgString}`;
        return msgString;
    }
};

/**
 * Checks if a folder exists.
 * @async
 * @param {String} dir  Folder path
 * @returns {Promise<any>}  Resolves if folder exist. Rejects if folder does not exist
 */
exports.isFolderExist = (dir) => {
    return new Promise((resolve, reject) => {
        fs.access(dir, fs.constants.F_OK, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Get the contents of a folder
 * @async
 * @param {String} dir  Folder path
 * @returns {Promise<any>}  Resolves with list of files. Rejects if folder does not exist
 */
exports.readFolder = (dir) => {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};

/**
 * Get the contents of a folder
 * @async
 * @param {String} dir  Folder path
 * @returns {Promise<any>}  Resolves with list of files. Rejects if folder does not exist
 */
exports.createFolder = async (dir, { sep = path.sep } = {}) => {
    const initDir = path.isAbsolute(dir) ? sep : '';
    const baseDir = '.';

    let parentDir = initDir;
    for (const childDir of _.split(dir, sep)) {
        const curDir = path.resolve(baseDir, parentDir, childDir);

        await new Promise((resolve, reject) => {
            fs.mkdir(curDir, (err) => {
                if (err && err.code !== 'EEXIST') {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        parentDir = curDir;
    }
};

/**
 * Get the contents of a folder
 * @async
 * @param {String} data  File contents
 * @param {String} fileNameWithPath  File location to save file in
 * @returns {Promise<any>}  Resolves if file is saved successfully. Rejects if file is not saved.
 */
exports.saveFile = async (data, fileNameWithPath) => {
    await this.createFolder(path.dirname(fileNameWithPath)); // create directory if not exist

    return new Promise((resolve, reject) => {
        fs.writeFile(fileNameWithPath, data, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Delete a file
 * @async
 * @param {String} fileNameWithPath  File to delete (full file path)
 * @returns {Promise<any>}  Resolves if file is deleted successfully. Rejects if file is not deleted.
 */
exports.deleteFile = (fileNameWithPath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(fileNameWithPath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

/**
 * Read the contents of a file
 * @async
 * @param {String} fileNameWithPath  File to delete (full file path)
 * @param {Boolean} [isTextFile=false]  Set `true` if is text file (i.e. utf8 encoding)
 * @returns {Promise<any>}  Resolves with file contents. Rejects if fail to read file contents.
 */
exports.readFile = (fileNameWithPath, isTextFile = false) => {
    const encoding = (isTextFile) ? 'utf8' : null;
    return new Promise((resolve, reject) => {
        fs.readFile(fileNameWithPath, encoding, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
};

/**
 * Normalises text for comparison
 * @param {String} text  Any string value
 * @returns {String}  Normalised text
 */
function _normalizeText(text) {
    return _.toLower(_.trim(text));
}
