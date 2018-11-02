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
const multer = require('multer');
const mime = require('mime');
const mail = require('../utils/mail');
const { JOB, ORDER } = require('../classes');
const vrpUtils = require('../../vrp-common/utils');
const vrpEnum = require('../../enum');
const vrpConfig = require('../../configuration');
const vrpSql = require('../../vrp-sql');
const { VrpSocketMessage } = require('../../vrp-common/socket');
const vrpUserUtils = require('../../vrp-user/user-utils');

const SOCKET_TOPIC = vrpEnum.SocketTopic.JOB;
const MAX_BULK_DELETE_COUNT = vrpConfig.get('database.sql.custom.maxDeleteCount');
const OFFLINE_FILES_FOLDER = vrpConfig.get('features.offlineSync.folder');
exports.version = 'v2.1';

(async () => {
    try {
        await vrpUtils.createFolder(OFFLINE_FILES_FOLDER, { sep: '/' });
    } catch (err) {
        log.fatal('<Folder> Unable to create offline files folder', err);
        process.exit();
    }
})();

exports.m_getOne = async (req, res, next) => {
    log.debug('m_getOneDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;

    try {
        if (vrpUserUtils.isPlanner(req.user)) {
            const dbRecord = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                }, {
                    model: vrpSql.DeliveryItem,
                }, {
                    model: vrpSql.VerificationCode,
                }],
            });

            req.answer = dbRecord;

        } else if (vrpUserUtils.isDriver(req.user)) {
            // allow driver to view his own job only
            const dbRecord = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
                required: true, // necessary for nested where query to work
                include: [{
                    required: true, // necessary for nested where query to work
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    include: [{
                        required: true, // necessary for nested where query to work
                        model: vrpSql.Vehicle,
                        where: {
                            DriverUsername: req.user.username,
                        },
                    }],
                }, {
                    model: vrpSql.DeliveryItem,
                }, {
                    model: vrpSql.VerificationCode,
                }],
            });

            if (_.isEmpty(dbRecord)) {
                req.answer = null;
            } else {
                // sequelize instance is immutable, so needs to convert to JSON first
                const response = dbRecord.toJSON();
                // append UserGroup information from DeliveryMaster so that vrp-message can receive UserGroup
                response.UserGroup = _.get(dbRecord, 'DeliveryMaster.UserGroup');
                req.answer = _.omit(response, ['DeliveryMaster']);
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_getAll = async (req, res, next) => {
    log.debug('m_getAllDeliveryDetail', req.user.username);

    let where = _.get(req.query, 'where', '{}');

    try {
        where = vrpUtils.unserialize(where);
        where = _.omit(where, ['UserGroup']); // prevent user from overwriting permission

        if (_.isEmpty(where) && _.isEmpty(req.scopes.date)) {
            throw new Error('Either where parameter or date/startDate/endDate parameters must be specified');
        }

        if (vrpUserUtils.isPlanner(req.user) || vrpUserUtils.isController(req.user)) {
            const dbRecords = await vrpSql.DeliveryDetail.scope(req.scopes.date).findAll({
                where: _.omit(where, ['DeliveryMaster']),
                include: [{
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    where: _.get(where, 'DeliveryMaster'),
                }, {
                    model: vrpSql.DeliveryItem,
                }, {
                    model: vrpSql.VerificationCode,
                }],
            });

            req.answer = dbRecords;

        } else if (vrpUserUtils.isDriver(req.user)) {
            // allow driver to view his own job only
            const dbRecords = await vrpSql.DeliveryDetail.scope(req.scopes.date).findAll({
                where: _.omit(where, ['DeliveryMaster']),
                include: [{
                    required: true, // necessary for nested where query to work
                    model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                    where: _.get(where, 'DeliveryMaster'),
                    include: [{
                        required: true, // necessary for nested where query to work
                        model: vrpSql.Vehicle,
                        attributes: [],
                        where: {
                            DriverUsername: req.user.username,
                        },
                    }],
                }, {
                    model: vrpSql.DeliveryItem,
                }, {
                    model: vrpSql.VerificationCode,
                }],
            });

            req.answer = _.map(dbRecords, (job) => {
                // sequelize instance is immutable, so needs to convert to JSON first
                job = job.toJSON();
                // append UserGroup information from DeliveryMaster so that vrp-message can receive UserGroup
                job.UserGroup = _.get(job, 'DeliveryMaster.UserGroup');
                return _.omit(job, 'DeliveryMaster');
            });
        }

        next();
    } catch (err) {
        log.debug('m_getAllDeliveryDetail Error: ' + err);
        next(err);
    }
};

exports.m_create = async (req, res, next) => {
    log.debug('m_createDeliveryDetail', req.user.username);

    const records = vrpUtils.toArray(_.get(req.body, 'record'));

    try {
        validateParams();
        validateRecords();
        const affectedUserGroups = await checkPermission(); // check if order exists and if user has permission

        const insertedRecords = await insertDatabase(affectedUserGroups);

        req.answer = vrpSql.DeliveryDetail.getPrimaryKeyValues(insertedRecords);
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(affectedUserGroups, insertedRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(records)) {
            throw new Error('Parameter `record` is required.');
        } else if (vrpSql.DeliveryDetail.hasPrimaryKeyValues(records)) {
            throw new Error('Primary key of the records must not be specified.');
        }
    }

    function validateRecords() {
        const errors = [];
        _.each(records, (record) => {
            if (!_.has(record, 'DeliveryMasterId')) {
                errors.push('Missing `record.DeliveryMasterId`.');
            } else if (_.has(record, 'DeliveryItems') && !_.isArray(record.DeliveryItems)) {
                errors.push(`Order ${record.DeliveryMasterId}. Error: Parameter \`record.DeliveryItems\` must be an array.`);
            } else if (_.has(record, 'VerificationCode') && _.isArray(record.VerificationCode)) {
                errors.push(`Order ${record.DeliveryMasterId}. Error: Parameter \`record.VerificationCode\` must be a JSON object.`);
            }
        });
        if (!_.isEmpty(errors)) {
            throw errors;
        }
    }

    async function checkPermission() {
        const orderIds = vrpUtils.toArray(_.map(records, 'DeliveryMasterId'));
        const scopes = [req.scopes.authz, { method: ['primaryKey', orderIds] }];
        const affectedUserGroups = await vrpSql.DeliveryMaster.scope(scopes).findAll({
            attributes: ['Id', 'UserGroup'],
            raw: true, // query for comparision only
        });

        const invalidOrderIds = _.difference(orderIds, _.map(affectedUserGroups, 'Id'));
        if (!_.isEmpty(invalidOrderIds)) {
            throw new Error(`Either order does not exist or not enough permissions: ${_.join(invalidOrderIds, ',')}`);
        }
        return affectedUserGroups;
    }

    async function insertDatabase(affectedUserGroups) {
        let transaction;
        try {
            transaction = await vrpSql.sequelize.transaction();

            const dbRecords = await Promise.map(records, (record) => {
                return vrpSql.DeliveryDetail.create(vrpSql.setCreatedBy(req, record), {
                    returning: true,
                    include: [{
                        model: vrpSql.DeliveryItem,
                    }, {
                        model: vrpSql.VerificationCode,
                    }],
                    transaction: transaction,
                });
            });

            await transaction.commit();
            return dbRecords;
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }

    function sendWebsocket(affectedUserGroups, dbRecords) {
        // group jobs by usergroup (to send message to correct group)
        _.each(_.groupBy(affectedUserGroups, 'UserGroup'), (orders, usergroup) => {
            const affectedJobs = _.map(orders, (order) => _.filter(dbRecords, { DeliveryMasterId: order.Id }));
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('create')
                .setContent(_.flatten(affectedJobs))
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });
    }
};

exports.m_bulkDelete = async (req, res, next) => {
    log.debug('m_bulkDeleteDeliveryDetail', req.user.username);

    const jobIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    try {
        validateParams();
        const dbRecords = await checkPermission(); // check if user has permission

        const rowCount = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', jobIds] }).destroy();
        req.answer = rowCount;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecords);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isEmpty(jobIds)) {
            throw new Error('Parameter `ids` is required.');
        } else if (jobIds.length > MAX_BULK_DELETE_COUNT) {
            throw new Error(`Maximum number of records allowed to be deleted is ${MAX_BULK_DELETE_COUNT}.`);
        }
    }

    async function checkPermission() {
        const affectedJobs = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', jobIds] }).findAll({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: [{
                    model: vrpSql.Vehicle,
                }],
            }],
        });

        const invalidJobIds = _.differenceBy(jobIds, _.map(affectedJobs, 'Id'), _.toNumber);
        if (!_.isEmpty(invalidJobIds)) {
            throw new Error(`Either job does not exist or not enough permissions: ${_.join(invalidJobIds, ',')}`);
        }
        return affectedJobs;
    }

    function sendWebsocket(deletedRecords) {
        // group messages by usergroup
        const plannerMessages = _.groupBy(deletedRecords, 'DeliveryMaster.UserGroup');
        _.each(plannerMessages, (jobs, usergroup) => {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('delete')
                .setContent(_.map(jobs, 'Id'))
                .setSender(req.user)
                .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
        });

        // group messages by driver username
        const driverMessages = _.groupBy(deletedRecords, 'DeliveryMaster.Vehicle.DriverUsername');
        _.each(driverMessages, (jobs, driverUsername) => {
            // `_.groupBy` will convert objects into strings
            if (!_.isEmpty(driverUsername) && driverUsername !== 'undefined' && driverUsername !== 'null') {
                new VrpSocketMessage(SOCKET_TOPIC)
                    .setPurpose('delete')
                    .setContent(_.map(jobs, 'Id'))
                    .setSender(req.user)
                    .emit(driverUsername);
            }
        });
    }
};

exports.m_update = async (req, res, next) => {
    log.debug('m_updateDeliveryDetail', req.user.username);

    const id = req.params.deliveryDetailId;
    const newValues = _.get(req.body, 'newValues', {});

    try {
        validateParams();

        const dbRecord = await checkPermission(); // check if user has permission

        await dbRecord.update(vrpSql.setModifiedBy(req, newValues));
        req.answer = 1;
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocket)(dbRecord);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        const newValuesId = newValues[vrpSql.DeliveryDetail.getPrimaryKey()];
        if (_.isEmpty(newValues)) {
            throw new Error('Parameter `newValues` is required.');
        } else if (!_.isNil(newValuesId) && _.toString(newValues[newValuesId]) !== _.toString(id)) {
            throw new Error('Unable to update primary key of existing record. Please delete then create a new record.');
        }
    }

    async function checkPermission() {
        const affectedJob = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: [{
                    model: vrpSql.Vehicle,
                }],
            }],
        });

        if (_.isEmpty(affectedJob)) {
            throw new Error(`Either job does not exist or not enough permissions: ${id}`);
        } else if (newValues.DeliveryMasterId !== undefined && !vrpUtils.isSameText(affectedJob.DeliveryMasterId, newValues.DeliveryMasterId)) {
            throw new Error('DeliveryMasterId cannot be modified. Create a new order instead');
        }

        return affectedJob;
    }

    function sendWebsocket(updatedRecord) {
        const message = new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('update')
            .setContent(_.omit(updatedRecord.toJSON(), ['DeliveryMaster'])) // sequelize instance is immutable, so needs to convert to JSON first to use omit
            .setSender(req.user);

        message.broadcast(vrpEnum.UserRole.PLANNER, _.get(updatedRecord, 'DeliveryMaster.UserGroup'));
        message.emit(_.get(updatedRecord, 'DeliveryMaster.Vehicle.DriverUsername'));
    }
};

exports.m_getByDeliveryMaster = async (req, res, next) => {
    log.debug('m_getDeliveryDetailByDeliveryMaster', req.user.username);

    const id = req.params.deliveryMasterId;

    try {
        const dbRecords = await vrpSql.DeliveryDetail.findAll({
            where: {
                DeliveryMasterId: id,
            },
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                attributes: [],
            }, {
                model: vrpSql.DeliveryItem,
            }, {
                model: vrpSql.VerificationCode,
            }],
        });

        req.answer = dbRecords;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_attemptJobFiles = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, callback) => {
        try {
            callback(null, vrpUtils.matchesRegex(/png|jpg|jpeg/, file.mimetype));
        } catch (err) {
            callback(err);
        }
    },
}).fields([{
    name: 'signature',
    maxCount: 1,
}, {
    name: 'notePhotos',
    maxCount: 3,
}, {
    name: 'photo',
    maxCount: 1,
}]);

/**
 * (1) Generate DeliveryTime and Status based on the *EndTime of the job
 * (2) Send email after update is successful
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_attemptJob = async (req, res, next) => {
    log.debug('m_attemptJob', req.user.username);

    const id = req.params.deliveryDetailId;
    const jobParams = castAttemptParams(req.body);
    const uploadedFiles = vrpUtils.unserialize(req.files);

    const delivered = _.get(jobParams, 'delivered', null);
    const driverNote = _.get(jobParams, 'note', null);
    const itemsHandled = _.get(jobParams, 'items', []);

    const notePhotos = vrpUtils.toArray(_.get(uploadedFiles, 'notePhotos', []));
    const podPhotoBuffer = _.get(uploadedFiles, 'photo[0].buffer', null);
    const podSignatureBuffer = _.get(uploadedFiles, 'signature[0].buffer', null);

    // do not stringify these values because it will stringify the buffer values as well
    log.info(`Attempted job ${id}`, jobParams);
    log.info('Attempted files', uploadedFiles);

    let allAffectedJobs;
    let completedJob;
    try {
        validateParams();
        const dbRecord = await validateRecord();

        const deliveredAtTime = moment();
        const newJobStatus = JOB.generateStatus(dbRecord, vrpUtils.toBoolean(delivered), deliveredAtTime);

        await validatePod(dbRecord, newJobStatus);
        allAffectedJobs = await updateDatabase(dbRecord, newJobStatus, deliveredAtTime);

        // sequelize instance is immutable, so needs to convert to JSON first to use omit
        completedJob = _.find(allAffectedJobs, { Id: _.toInteger(id) });
        req.answer = _.omit(completedJob.toJSON(), 'DeliveryMaster.Vehicle');
        next();

        if (req.answer) {
            vrpUtils.silenceError(sendWebsocketForAttempt)(vrpUtils.toArray(allAffectedJobs), req.user);
            vrpUtils.silenceError(sendEmailForAttempt)(completedJob, podSignatureBuffer);
            vrpUtils.silenceError(sendEmailToPlanners)(allAffectedJobs);
        }
    } catch (err) {
        next(err);
    }

    function validateParams() {
        if (_.isNil(delivered)) {
            throw new Error('Parameter `delivered` is required.');
        } else if (delivered !== true && delivered !== false) {
            throw new Error('Parameter `delivered` must be a Boolean.');
        } else if (!_.isEmpty(itemsHandled) && !_.isArray(itemsHandled)) {
            throw new Error('Parameter `items` must be an Array.');
        }
    }

    async function validateRecord() {
        const dbRecord = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', id] }).findOne({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: [{
                    model: vrpSql.Vehicle,
                }],
            }, {
                model: vrpSql.DeliveryItem,
            }],
        });

        if (dbRecord === null) {
            throw new Error('Parameter `id` must be a valid DeliveryDetail Id.');
        } else if (!JOB.isCorrectDriver(dbRecord, req.user)) {
            throw new Error('Not authorised to send the delivered request.');
        } else if (JOB.isOntime(dbRecord) || JOB.isLate(dbRecord)) {
            throw new Error(`Job ${dbRecord.Id} has already been attempted.`);
        } else if (_.size(_.differenceBy(_.map(itemsHandled, 'Id'), _.map(dbRecord.DeliveryItems, 'Id'), _.toNumber)) > 0) {
            throw new Error(`Items does not belong to job ${dbRecord.Id}`);
        }

        if (JOB.isDelivery(dbRecord)) {
            const pickupJobNotDone = await vrpSql.DeliveryDetail.findOne({
                where: {
                    Id: {
                        [vrpSql.sequelize.Op.ne]: id,
                    },
                    JobSequence: {
                        [vrpSql.sequelize.Op.lt]: dbRecord.JobSequence,
                    },
                    DeliveryMasterId: dbRecord.DeliveryMasterId,
                    JobType: JOB.TYPE.PICKUP,
                    Status: [JOB.STATUS.PENDING, JOB.STATUS.EXPECTED_TO_BE_LATE],
                },
                attributes: ['Id'],
            });

            if (!_.isNil(pickupJobNotDone)) {
                throw new Error(`Pickup job ${pickupJobNotDone.Id} must be done first.`);
            }
        }

        return dbRecord;
    }

    function validatePod(job, newJobStatus) {
        const jobRequireSignature = JOB.requirePodSignature(_.extend({}, job, { Status: newJobStatus }));
        if (jobRequireSignature && _.isNil(podSignatureBuffer)) {
            throw new Error('Parameter `signature` is required.');
        } else if (JOB.requirePodPhoto() && _.isNil(podPhotoBuffer)) {
            throw new Error('Parameter `photo` is required.');
        }
    }

    function updateDatabase(job, newJobStatus, deliveredAtTime) {
        const orderId = _.get(job, 'DeliveryMaster.Id');
        const plateNumber = _.get(job, 'DeliveryMaster.Vehicle.PlateNumber');
        return updateDatabaseForAttempt(req, orderId, {
            jobId: id,
            status: newJobStatus,
            delivered: delivered,
            deliveredAtTime: deliveredAtTime,
            note: driverNote,
            attemptedByDriver: _.isEmpty(req.user.fullname) ? req.user.username : req.user.fullname,
            attemptedByVehicle: plateNumber,
            items: itemsHandled,
            signatureBuffer: podSignatureBuffer,
            photoBuffer: podPhotoBuffer,
            notePhotosBuffer: _.map(notePhotos, (photo) => photo.buffer),
        });
    }
};

exports.m_offlineJobFiles = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            try {
                callback(null, OFFLINE_FILES_FOLDER);
            } catch (err) {
                callback(err);
            }
        },
        filename: (req, file, callback) => {
            try {
                callback(null, vrpUtils.getFileName(file.originalname, mime.getExtension(file.mimetype)));
            } catch (err) {
                callback(err);
            }
        },
    }),
    fileFilter: (req, file, callback) => {
        try {
            callback(null, vrpUtils.matchesRegex(/png|jpg|jpeg/, file.mimetype));
        } catch (err) {
            callback(err);
        }
    },
}).any();

/**
 * NOTE: New file will not overwrite existing values if they exist.
 * NOTE: The content will be saved into server
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_sync = async (req, res, next) => {
    log.debug('m_sync', req.user.username);

    const jobs = req.body;
    const offlineFiles = vrpUtils.unserialize(req.files);

    // do not stringify these values because it will stringify the buffer values as well
    log.info('Sync jobs', jobs);
    log.info('Sync offlineFiles', offlineFiles);

    try {
        parseFiles();
        parseData();
        const jobsList = removeDuplicates();
        await validateFileContent(jobsList);
        await updateDatabase(jobsList);
        saveErrorsIntoFile(jobsList);
        deleteUnnecessaryFiles(jobsList);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }

    function parseFiles() {
        log.trace('(Sync) Parse files');
        _.each(offlineFiles, (file) => {
            // file has the same arrayindex as job (i.e. file[0] is photo for job[0])
            const arrayIndex = _.head(_.split(file.fieldname, '['));
            const job = jobs[arrayIndex];

            if (_.isNil(job)) {
                log.trace(`<OfflineJob> Delete file since respective job details does not exist ${file.path}`);
                try {
                    vrpUtils.deleteFile(file.path); // not necessary to wait before continuing the process
                } catch (err) {
                    log.error(`<OfflineJob> Unable to delete file from ${file.path}`, err);
                }
            } else {
                // check if there's existing file linked to this job
                const existingFile = _.get(jobs, file.fieldname);
                // append current file to list of existing files
                _.set(jobs, file.fieldname, vrpUtils.toArray(existingFile, file));
            }
        });
    }

    function parseData() {
        log.trace('(Sync) Parse data');
        _.each(jobs, castAttemptParams);
    }

    function removeDuplicates() {
        log.trace('(Sync) Remove duplicates');
        // duplicates may happen when driver re-attempts a job
        return _.reduce(jobs, (uniqJobsList, job, reduceDone) => {
            const existingJobInList = _.find(uniqJobsList, { jobId: job.jobId });

            if (_.isNil(existingJobInList)) {
                uniqJobsList = vrpUtils.toArray(uniqJobsList, job);

            } else if (existingJobInList.delivered && !job.delivered) {
                // existingJobInList is more updated
                existingJobInList.notePhotos = vrpUtils.toArray([], job.notePhotos, existingJobInList.notePhotos);

            } else {
                // if one is delivered and the other is not delivered, pick the delivered job
                const jobIsDelivered = !existingJobInList.delivered && job.delivered;
                // if both delivered, pick the job with earlier delivery time
                const jobIsEarlier = existingJobInList.delivered && job.delivered && moment(job.deliveryTime).isBefore(moment(existingJobInList.deliveryTime));

                if (jobIsDelivered) {
                    // merge list of notephotos
                    job.notePhotos = vrpUtils.toArray(existingJobInList.notePhotos, job.notePhotos);
                }
                if (jobIsDelivered || jobIsEarlier) {
                    // replace existingJobInList
                    _.remove(uniqJobsList, { jobId: existingJobInList.jobId });
                    uniqJobsList = vrpUtils.toArray(uniqJobsList, job);
                }
            }
            return uniqJobsList;
        }, []);
    }

    async function validateFileContent(jobsList) {
        log.trace('(Sync) Validate file content');
        const deliveryDetailIds = _.uniq(_.map(jobsList, 'jobId'));

        // cannot enforce `req.scopes.authz` check
        const dbRecords = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', deliveryDetailIds] }).findAll({
            include: [{
                model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
                include: [{
                    model: vrpSql.Vehicle,
                }],
            }, {
                model: vrpSql.DeliveryPOD,
                attributes: ['DeliveryDetailId'],
            }],
        });

        const relevantPickupJobs = await vrpSql.DeliveryDetail.findAll({
            where: {
                DeliveryMasterId: _.uniq(_.map(dbRecords, 'DeliveryMasterId')),
                JobType: JOB.TYPE.PICKUP,
                Status: [JOB.STATUS.PENDING, JOB.STATUS.EXPECTED_TO_BE_LATE],
            },
        });

        // validate jobs
        _.each(jobsList, (job) => {
            const detailsFromDb = _.find(dbRecords, { Id: job.jobId });
            if (_.isNil(detailsFromDb)) {
                job.error = '`jobId` does not exist.';
            } else if (_.isNil(job.jobId) || _.isNil(job.deliveryTime) || _.isNil(job.delivered)) {
                job.error = '`jobId`, `deliveryTime` and `delivered` parameters are required for each file record.';
            } else if (!moment(job.deliveryTime, moment.ISO_8601).isValid()) {
                job.error = '`deliveryTime` is not in ISO8601 format. Timezone matters (e.g. Z implies UTC).';
            } else if (JOB.isCompleted(detailsFromDb) || !_.isNil(detailsFromDb.DeliveryPOD)) {
                job.error = 'Order has already been delivered/updated before.';
            } else if (!isPickupInShipmentDone(job, detailsFromDb, relevantPickupJobs)) {
                job.error = 'Pickup job of DeliveryMaster ' + detailsFromDb.DeliveryMasterId + ' must be done first.';
            } else if (!ORDER.isAssigned(detailsFromDb.DeliveryMaster)) {
                job.error = 'Not authorised to send the delivered request.';
            } else {
                const jobStatus = JOB.generateStatus(detailsFromDb, job.delivered, job.deliveryTime);
                const jobRequireSignature = JOB.requirePodSignature(_.extend({}, detailsFromDb, { Status: jobStatus }));
                if (jobRequireSignature && _.isNil(job.signature)) {
                    job.error = 'Parameter `signature` is required.';
                } else if (JOB.requirePodPhoto() && _.isNil(job.photo)) {
                    job.error = 'Parameter `photo` is required.';
                } else {
                    job.details = detailsFromDb;
                    job.status = jobStatus;
                }
            }
        });

        function isPickupInShipmentDone(job, detailsFromDb, relevantPickupJobs) {
            const pickupRequired = _.find(relevantPickupJobs, (pickup) => {
                return pickup.Id !== detailsFromDb.Id && // find another job
                    pickup.DeliveryMasterId === detailsFromDb.DeliveryMasterId && // with same order Id
                    pickup.JobSequence < detailsFromDb.JobSequence; // and expected to do first
            });

            if (_.isEmpty(pickupRequired) || JOB.isCompleted(pickupRequired)) {
                return true;
            } else {
                // if pickup is not done, check if pickup is inside jobs to sync
                const pickupInSyncList = _.find(jobsList, { jobId: pickupRequired.Id });
                if (!pickupInSyncList) {
                    return false;
                } else {
                    return moment(pickupInSyncList.deliveryTime).isSameOrBefore(moment(job.deliveryTime));
                }
            }
        }
    }

    function updateDatabase(jobsList) {
        log.trace('(Sync) Update database');
        const validJobs = _.filter(jobsList, (job) => _.isNil(job.error));

        if (!_.isEmpty(validJobs)) {
            return Promise.map(validJobs, async (job) => {
                // get the first file (`parseFiles` function will cause these to be arrays)
                const signatureImgPath = _.get(job, 'signature[0].path');
                const photoImgPath = _.get(job, 'photo[0].path');

                const getBlobPromises = _.concat([
                    (signatureImgPath) ? vrpUtils.readFile(signatureImgPath, false) : null,
                    (photoImgPath) ? vrpUtils.readFile(photoImgPath, false) : null,
                ], _.map(job.notePhotos, (photo) => vrpUtils.readFile(photo.path, false)));

                let dbRecords;
                let signatureBlob;
                let photoBlob;
                let notePhotos;
                try {
                    [signatureBlob, photoBlob, ...notePhotos] = await Promise.all(getBlobPromises);

                    dbRecords = await updateDatabaseForAttempt(req, _.get(job, 'details.DeliveryMaster.Id'), {
                        jobId: job.jobId,
                        status: job.status,
                        delivered: job.delivered,
                        deliveredAtTime: job.deliveryTime,
                        note: job.note,
                        attemptedByDriver: job.attemptedByDriver,
                        attemptedByVehicle: job.attemptedByVehicle,
                        items: job.items,
                        notePhotosBuffer: notePhotos,
                        signatureBuffer: signatureBlob,
                        photoBuffer: photoBlob,
                    });
                } catch (err) {
                    job.error = vrpUtils.parseError(err);
                }

                vrpUtils.silenceError(sendWebsocketForAttempt)(dbRecords, req.user);

                const attemptedJob = _.find(dbRecords, { Id: job.jobId }); // actual job that was attempted
                vrpUtils.silenceError(sendEmailForAttempt)(attemptedJob, signatureBlob);
                vrpUtils.silenceError(sendEmailToPlanners)(dbRecords);

                return dbRecords;
            });
        }
    }

    function saveErrorsIntoFile(jobsList) {
        log.trace('(Sync) Save errors into file');
        const jobsWithError = _.filter(jobsList, (job) => !_.isNil(job.error));

        if (!_.isEmpty(jobsWithError)) {
            const fileInput = JSON.stringify({
                sent_by: _.pick(req.user, ['fullname', 'username', 'role']),
                sent_on: moment().toString(),
                jobs: _.map(jobsWithError, (job) => _.omit(job, ['details'])),
            });

            const filePath = `${OFFLINE_FILES_FOLDER}/${vrpUtils.getFileName('error', 'json')}`;
            log.info(`(Sync) Error File: ${filePath}`);

            try {
                vrpUtils.saveFile(fileInput, filePath); // not necessary to wait before continuing the process
            } catch (err) {
                log.error(`<OfflineJob> Unable to save error file ${filePath}`, _.map(jobsWithError, 'error'), err);
            }
        }
    }

    function deleteUnnecessaryFiles(jobsList) {
        log.trace('(Sync) Delete unnecessary files');
        _.each(offlineFiles, (file) => {
            const arrayIndex = _.head(_.split(file.fieldname, '['));
            const job = jobsList[arrayIndex];

            // delete file if job is saved successfully
            if (!_.get(job, 'error')) {
                try {
                    vrpUtils.deleteFile(file.path); // not necessary to wait before continuing the process
                } catch (err) {
                    log.error(`<OfflineJob> Unable to delete file from ${file.path}`, err);
                }
            }
        });
    }
};

// Cast values to their correct data type
function castAttemptParams(job) {
    job = vrpUtils.unserialize(job);
    job.jobId = _.toInteger(job.jobId);
    job.delivered = vrpUtils.toBoolean(job.delivered);
    job.items = _.map(job.items, (item) => Object.assign(item, {
        ActualItemQty: _.toNumber(item.ActualItemQty),
    }));
    return job;
}

async function updateDatabaseForAttempt(req, orderId, job) {
    const jobId = _.get(job, 'jobId');
    const jobStatus = _.get(job, 'status');
    const delivered = vrpUtils.toBoolean(_.get(job, 'delivered'));
    const deliveredAtTime = _.get(job, 'deliveredAtTime');
    let driverNote = _.get(job, 'note');
    const attemptedByDriver = _.get(job, 'attemptedByDriver');
    const attemptedByVehicle = _.get(job, 'attemptedByVehicle');
    const itemsHandled = vrpUtils.toArray(_.get(job, 'items', []));
    const notePhotos = vrpUtils.toArray(_.get(job, 'notePhotosBuffer', []));
    const podSignature = _.get(job, 'signatureBuffer');
    const podPhoto = _.get(job, 'photoBuffer');

    try {
        driverNote = vrpUtils.unserialize(driverNote);
    } catch (e) {
        driverNote = [{
            key: 'comments',
            value: driverNote,
        }];
    }

    driverNote = _.reduce(vrpUtils.toArray(driverNote), (validNotes, note) => {
        // note without key is counted as invalid
        if (!_.isEmpty(_.get(note, 'key'))) {
            // remove new lines
            if (_.isString(note.value)) {
                note.value = _.replace(_.trim(note.value), /(\r\n|\n|\r)/gm, '. ');
            }
            validNotes.push(note);
        }
        return validNotes;
    }, []);

    let transaction;
    let updatedJobDetails;
    let otherJobsAffectedCount;
    let affectedJobConditions;
    try {
        transaction = await vrpSql.sequelize.transaction();

        const [jobAffectedCount] = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', jobId] }).update(vrpSql.setModifiedBy(req, {
            Status: jobStatus,
            ActualDeliveryTime: deliveredAtTime,
            NoteFromDriver: _.isEmpty(driverNote) ? null : driverNote,
        }), {
            transaction: transaction,
        });

        if (jobAffectedCount === 0) {
            throw new Error(`Unable to update DeliveryDetail Id ${jobId}.`);
        }

        const [orderAffectedCount] = await vrpSql.DeliveryMaster.scope({ method: ['primaryKey', orderId] }).update(vrpSql.setModifiedBy(req, {
            LastAttemptedByDriver: attemptedByDriver,
            LastAttemptedByPlateNumber: attemptedByVehicle,
        }), {
            transaction: transaction,
        });

        if (orderAffectedCount === 0) {
            throw new Error(`Unable to update DeliveryMaster Id ${orderId}.`);
        }

        if (delivered) {
            try {
                await Promise.map(itemsHandled, async (item) => {
                    const itemQty = _.toNumber(_.get(item, 'ActualItemQty'));
                    const deliveryItem = {
                        ActualItemQty: _.isNaN(itemQty) ? 0 : itemQty,
                    };

                    const [itemAffectedCount] = await vrpSql.DeliveryItem.scope({ method: ['primaryKey', item.Id] }).update(vrpSql.setModifiedBy(req, deliveryItem), {
                        where: {
                            DeliveryDetailId: jobId,
                        },
                        transaction: transaction,
                    });

                    if (itemAffectedCount === 0) {
                        throw new Error('None updated.');
                    }
                });
            } catch (err) {
                throw new Error(`Job ${jobId}. Unable to update DeliveryItem. ${vrpUtils.parseError(err, false)}`);
            }
        }

        if (jobStatus !== JOB.STATUS.UNSUCCESSFUL && (podSignature || podPhoto)) {
            try {
                await vrpSql.DeliveryPOD.create(vrpSql.setCreatedBy(req, {
                    DeliveryDetailId: jobId,
                    Signature: podSignature,
                    Photo: podPhoto,
                }), {
                    transaction: transaction,
                });
            } catch (err) {
                throw new Error(`Job ${jobId}. Unable to create DeliveryPOD. ${vrpUtils.parseError(err, false)}`);
            }
        }

        if (!_.isEmpty(notePhotos)) {
            try {
                await Promise.map(notePhotos, async (photo) => {
                    // use create instead of bulkCreate because of performance (bulkCreate for blobs is very slow)
                    await vrpSql.DeliveryNote.create(vrpSql.setCreatedBy(req, {
                        DeliveryDetailId: jobId,
                        Photo: photo,
                    }), {
                        transaction: transaction,
                    });
                });
            } catch (err) {
                throw new Error(`Job ${jobId}. Unable to create DeliveryNote. ${vrpUtils.parseError(err, false)}`);
            }
        }

        updatedJobDetails = await vrpSql.DeliveryDetail.scope({ method: ['primaryKey', jobId] }).findOne({
            raw: true, // used for checking only
            transaction: transaction,
        });

        // if job is pickup and unsuccessful, check if there is affected delivery
        if (JOB.isPickup(updatedJobDetails) && JOB.isUnsuccessful(updatedJobDetails)) {
            affectedJobConditions = {
                where: {
                    JobSequence: {
                        [vrpSql.sequelize.Op.gt]: updatedJobDetails.JobSequence,
                    },
                    JobType: JOB.TYPE.DELIVERY,
                    DeliveryMasterId: updatedJobDetails.DeliveryMasterId,
                },
            };

            // update the status of all other affected deliveries
            [otherJobsAffectedCount] = await vrpSql.DeliveryDetail.update(vrpSql.setModifiedBy(req, {
                Status: JOB.STATUS.UNSUCCESSFUL,
                ActualDeliveryTime: deliveredAtTime,
            }), _.extend({
                transaction: transaction,
            }, affectedJobConditions));
        }

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }

    let affectedJobIds;
    if (otherJobsAffectedCount > 0) {
        // get details of affected jobs
        const dbRecords = await vrpSql.DeliveryDetail.findAll(_.extend({
            attributes: ['Id'],
            raw: true, // used for checking only
        }, affectedJobConditions));

        affectedJobIds = _.map(dbRecords, 'Id');
    }

    const jobIds = _.flatten(vrpUtils.toArray(updatedJobDetails.Id, affectedJobIds));
    // cannot enforce `req.scopes.authz` check
    return vrpSql.DeliveryDetail.scope({ method: ['primaryKey', jobIds] }).findAll({
        include: [{
            model: vrpSql.DeliveryMaster.scope(req.scopes.authz),
            include: [{
                model: vrpSql.Vehicle,
            }],
        }, {
            model: vrpSql.DeliveryItem,
        }],
    });
}

function sendWebsocketForAttempt(dbRecords, user) {
    dbRecords = vrpUtils.toArray(dbRecords);

    // group messages by usergroup
    const plannerMessages = _.groupBy(dbRecords, 'DeliveryMaster.UserGroup');
    _.each(plannerMessages, (jobs, usergroup) => {
        new VrpSocketMessage(SOCKET_TOPIC)
            .setPurpose('attempted')
            // sequelize instance is immutable, so needs to convert to JSON first to use omit
            .setContent(_.map(jobs, (job) => _.omit(job.toJSON(), ['DeliveryPOD', 'DeliveryItem.Item'])))
            .setSender(user)
            .broadcast(vrpEnum.UserRole.PLANNER, usergroup);
    });

    // group messages by driver username
    const driverMessages = _.groupBy(dbRecords, 'DeliveryMaster.Vehicle.DriverUsername');
    _.each(driverMessages, (jobs, driverUsername) => {
        // `_.groupBy` will convert objects into strings
        if (!_.isEmpty(driverUsername) && driverUsername !== 'undefined' && driverUsername !== 'null') {
            new VrpSocketMessage(SOCKET_TOPIC)
                .setPurpose('attempted')
                // sequelize instance is immutable, so needs to convert to JSON first to use omit
                .setContent(_.map(jobs, (job) => _.omit(job.toJSON(), ['DeliveryMaster', 'DeliveryPOD', 'DeliveryItem.Item'])))
                .setSender(user)
                .emit(driverUsername);
        }
    });
}

function sendEmailForAttempt(job, podSignature) {
    return mail.serviceChit(job, podSignature);
}

function sendEmailToPlanners(jobs) {
    return mail.plannerNotification(_.first(jobs), _.tail(jobs));
}
