/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Problem');

const _ = require('lodash');
const moment = require('moment');
const vrpEnum = require('../enum');
const ProblemUtils = require('./problem-utils');
const vrpUtils = require('../vrp-common/utils');
const vrpMongo = require('../vrp-common/mongo');
const { VrpSocketMessage } = require('../vrp-common/socket');
const vrpMapUtils = require('../vrp-map-service/map-utils');
const vrpMeasureV2 = require('../vrp-map-service/vrp-measure-v2');

let colProblem;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colProblem = await vrpMongo.getCollection(mongoDb, 'problem');
});

/**
 * Get a single problem with specific id.
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_getProblem = async (req, res, next) => {
    const problemId = _.get(req.params, 'problemId');
    const fullProblemInput = _.get(req.body, 'problem');
    const filter = Object.assign({}, req.filter, vrpMongo.getFindIdFilter(problemId));

    log.debug('m_getProblem', filter);

    try {
        let problem;
        if (fullProblemInput) {
            problem = Object.assign({}, {
                _id: moment().format(vrpEnum.DateFormat.FILE_SAFE), // will be used to save as output file
            }, fullProblemInput);

        } else if (problemId) {
            problem = await colProblem.findOne(filter);
        }

        if (!problem) {
            throw new Error(`Could not find problem with _id=${problemId} or in request body`);
        }

        req.answer = req.problem = problem;
        next();
    } catch (err) {
        next(`Invalid problem to optimize: ${err}`);
    }
};

/**
 * Get all problems in abstract format
 * @param {Object} req  todo
 * @param {Object} res  todo
 * @param {Function} next  todo
 * @returns {void}
 */
exports.m_getAbstractProblems = async (req, res, next) => {
    const filter = req.filter;

    log.debug('m_getAbstractProblems', filter);

    try {
        const result = await colProblem.aggregate([{
            $match: filter,
        }, {
            $project: {
                name: 1,
                modified_date: 1,
                created_date: 1,
                coord_mode: 1,
                fleet_size: 1,
                no_of_solutions: {
                    $size: {
                        $ifNull: ['$solutions', []],
                    },
                },
                no_of_vehicles: {
                    $size: {
                        $ifNull: ['$vehicles', []],
                    },
                },
                no_of_orders: {
                    $sum: [{
                        $size: {
                            $ifNull: ['$services', []],
                        },
                    }, {
                        $size: {
                            $ifNull: ['$shipments', []],
                        },
                    }],
                },
            },
        }]).toArray();

        req.answer = result;
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_createProblem = async (req, res, next) => {
    const username = _.get(req, 'user.username');
    const originalProblem = req.body;

    try {
        const validatedProblem = ProblemUtils.createValidatedProblem(originalProblem, { username });

        const result = await colProblem.insertOne(_.omit(validatedProblem, ['_id']), { safe: 1 });

        const problem = _.get(result, 'ops[0]');
        if (!problem) {
            throw new Error('Could not create problem');
        }

        req.answer = req.problem = problem;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_deleteProblems = async (req, res, next) => {
    const problemIds = vrpUtils.toArray(_.get(req.body, 'ids'));

    const filter = Object.assign({}, req.filter, { _id: { $in: _.map(problemIds, vrpMongo.getObjectId) } });

    log.warn('m_deleteProblems', filter);

    try {
        const result = await colProblem.deleteMany(filter);

        if (!result.deletedCount) {
            throw new Error(`Failed to delete ${problemIds.length} problem`);
        }

        log.debug(`${result.deletedCount} document(s) deleted`);
        req.answer = result.deletedCount;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_setMongoOps = (operator) => (req, res, next) => {
    const update = _.omit(_.get(req.body, 'update'), '_id');

    try {
        if (_.isEmpty(update)) {
            throw new Error('update request body is required');
        }

        req.body.update = { [operator]: update };
        next();
    } catch (err) {
        next(err);
    }
};

exports.m_updateOne = async (req, res, next) => {
    const query = _.get(req.body, 'query');
    const update = _.get(req.body, 'update');
    const problemId = _.get(req.params, 'problemId');

    const filter = Object.assign({}, req.filter, vrpMongo.getFindIdFilter(problemId), query);

    log.debug('m_updateOne', req.body.update, filter);

    try {
        const result = await colProblem.findOneAndUpdate(filter, update, {
            upsert: false,
            returnOriginal: false,
        });

        req.answer = req.problem = _.get(result, 'value');

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_geocode = [
    (req, res, next) => {
        // add vehicles and jobs' addresses into problem.addresses
        ProblemUtils.addAddressesToProblem(req.problem);

        req.body.addresses = req.problem.addresses;
        next();
    },
    vrpMeasureV2.m_searchAddressInDb,
    vrpMeasureV2.m_geocode,
    (req, res, next) => {
        // update vehicles and jobs' addresses based on the newly updated problem.addresses
        req.problem.addresses = req.body.addresses;
        ProblemUtils.updateFromAddresses(req.problem);

        req.answer = req.problem;
        next();
    },
];

exports.m_saveProblem = async (req, res, next) => {
    const problem = req.problem;

    log.debug('m_saveProblem', problem._id);

    try {
        if (!_.isNil(problem._id)) {
            problem.modified_date = new Date();

            const result = await colProblem.updateOne({
                _id: vrpMongo.getObjectId(problem._id),
            }, {
                $set: _.omit(problem, '_id'),
            });

            if (!req.answer) {
                req.answer = result.result;
            }
        }

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_queryDistanceMatrix = (req, res, next) => {
    const problem = req.problem;
    const username = _.get(req, 'user.username');
    const stopWatch = new vrpUtils.StopWatch();

    try {
        const validAddresses = _.filter(problem.addresses, (a) => !a.note && a.lat && a.lon); // note in address indicates issues with the object (e.g. invalid address)

        const matrixReq = {
            body: {
                coordinates: _.map(validAddresses, (from) => [from.lat, from.lon]),
                sources: validAddresses,
                destinations: validAddresses,
            },
        };

        log.debug('m_queryDistanceMatrix', validAddresses);

        vrpMeasureV2.m_distanceMatrixOnTheFly(matrixReq, null, (err) => {
            _logger(null);

            try {
                if (err) {
                    throw new Error(`An error has occurred - ${err}`);
                }

                const measures = matrixReq.answer;
                const csv = vrpMapUtils.convertMeasuresToCSV(measures, validAddresses);
                req.answer = csv;

                next();
            } catch (err) {
                next(err);
            }
        });

        req.on('close', () => {
            log.debug('Request is cancelled by user');
            next('Request is cancelled');
        });
    } catch (err) {
        next(err);
    }

    function _logger(message) { // set up logger
        if (username) {
            const messageWithTime = `${stopWatch.getDuration()} - Distance matrix: ${message}}`;
            log.trace(messageWithTime);
            new VrpSocketMessage()
                .setContent(messageWithTime)
                .emit(username);
        }
    }
};

exports.m_optimize = async (req, res, next) => {
    const username = _.get(req, 'user.username');
    const usergroup = _.get(req, 'user.usergroup');

    const problem = req.problem;
    const userOptions = Object.assign({}, req.query, _.omit(req.body, 'problem'));

    const options = Object.assign({
        engine: 'chinh',
        solutionId: `s_${moment().format(vrpEnum.DateFormat.FILE_SAFE)}`, // will be used to save as output file
        isSaved: true,
        constraints: 'timeWindow_priorityJob',
    }, userOptions);

    log.debug('m_optimize', JSON.stringify(options));

    const childProcess = await ProblemUtils.optimize(problem, options, _logger, (err, solution) => {
        // end handler
        try {
            if (err) {
                throw err;
            }

            ProblemUtils.addAddressesToSolution(problem, solution);

            solution.usergroup = usergroup;
            req.answer = solution;
            next();

            if (options.isSaved) {
                _saveSolutionToDb(solution);
            }
        } catch (err) {
            next(err);
        }
    });

    req.on('close', () => {
        if (childProcess) {
            childProcess.kill('SIGINT');
        }
        next('Request is cancelled by user');
    });

    function _logger(message) {
        if (username) {
            new VrpSocketMessage()
                .setContent(message)
                .emit(username);
        }
    }

    async function _saveSolutionToDb(solution) {
        const _query = vrpMongo.getFindIdFilter(problem._id);
        try {
            // remove old solution
            await colProblem.updateOne(_query, {
                $pull: {
                    solutions: {
                        id: solution.id,
                    },
                },
            }, {
                upsert: false,
            });

            // update with new solution
            await colProblem.updateOne(_query, {
                $push: {
                    solutions: solution,
                },
            });
        } catch (err) {
            log.error('Unable to save problem', err);
        }
    }
};

exports.m_attachSolutionsToProblem = async (req, res, next) => {
    const { username, usergroup } = req.user;
    const _id = _.get(req.problem, '_id');

    try {
        const validatedProblem = ProblemUtils.createValidatedProblem(req.problem, { username });

        const result = await colProblem.findOneAndUpdate({
            _id,
        }, {
            $set: { modified_date: new Date() },
            $setOnInsert: _.omit(validatedProblem, ['_id', 'modified_date']),
        }, {
            upsert: true,
            returnOriginal: false,
        });

        const updatedSolutions = _.get(result, 'value.solutions');

        // filter only solutions with usergroup
        const filterByUserGroup = (solution) => (!usergroup) || (vrpUtils.isSameText(solution.usergroup, usergroup));
        validatedProblem.solutions = _.filter(updatedSolutions, filterByUserGroup);

        req.answer = req.problem = validatedProblem;
        next();
    } catch (err) {
        next(err);
    }
};
