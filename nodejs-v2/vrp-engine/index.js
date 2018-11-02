/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology  All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Engine');

const _ = require('lodash');
const process = require('child_process');
const vrpUtils = require('../vrp-common/utils');
const vrpEnum = require('../enum');
const vrpConfig = require('../configuration');

const CHINH_SOLVER = vrpConfig.get('engine.chinh');
const SIWEI_SOLVER = vrpConfig.get('engine.siwei');
const COMMAND = vrpConfig.get('engine.javaPath');
const TEMP_FOLDER = vrpConfig.get('tempFolder'); // folder to store scratch files (input/output/matrix files in optimization)

const ENGINE = {};

ENGINE.chinh = {
    jarFile: `${__dirname}/${CHINH_SOLVER}`,
    logConfFile: `${__dirname}/chinh-solver-logback.xml`,
    createInput: (problem) => JSON.stringify(problem),
    formatSolution: (solution) => {
        _.each(solution.routes, (route, routeIndex) => {
            route.id = routeIndex;
        });
    },
    run: function runEngine(options) {
        const args = [
            `-Dlogback.configurationFile=${this.logConfFile}`,
            '-jar', this.jarFile,
            '-i', options.input,
            '-o', options.output,
        ];

        args.push('-t', _.get(options, 'nThreads', '1'));

        if (options.matrix) {
            args.push('-c', options.matrix);
        }

        if (options.constraints) {
            args.push('-s', options.constraints);
        }

        if (options.maxIterations) {
            args.push('-n', options.maxIterations);
        }

        if (options.maxRunningTime) {
            args.push('-maxRunningTime', options.maxRunningTime);
        }

        if (options.costModel) {
            args.push('-costModel', options.costModel);
        }

        if (options.sortByVehicleId) {
            args.push('-process', 'LowIdxVeh1st');
        }

        if (options.enableMinJobPenalty) {
            args.push('-eqJobAssignPenMult', options.minJobPenalty || 0.3);
        }

        const initialSolId = _.get(options, 'dynamicSettings.initialSolId');
        if (!_.isNil(initialSolId)) {
            args.push('-r', initialSolId);
        }

        return _runJava(args, (data) => {
            options.dataHandler(data);
        }, options.errorHandler, options.endHandler);
    },
};

ENGINE.siwei = {
    jarFile: `${__dirname}/${SIWEI_SOLVER}`,
    logConfFile: `${__dirname}/siwei-solver-logback.xml`,
    algoConfFile: `${__dirname}/siwei-solver-configuration.json`,
    createInput: (problem) => JSON.stringify(problem),
    formatSolution: (solution) => {
        _.each(solution.routes, (route, routeIndex) => {
            route.id = routeIndex;
        });
        solution.unassigned_jobs = _.uniq(solution.unassigned_jobs);
        solution.no_unassigned_jobs = solution.unassigned_jobs.length;
    },
    run: function runEngine(options) {
        const args = [
            `-Dlogback.configurationFile=${this.logConfFile}`,
            '-jar', this.jarFile,
            '-i', options.input,
            '-o', options.output,
            '-a', this.algoConfFile,
        ];

        args.push('-t', _.get(options, 'nThreads', '1'));

        if (options.matrix) {
            args.push('-c', options.matrix);
        }

        if (options.constraints) {
            args.push('-s', options.constraints);
        }

        if (options.maxIterations) {
            args.push('-n', options.maxIterations);
        }

        if (options.maxRunningTime) {
            args.push('-maxRunningTime', options.maxRunningTime);
        }

        const initialSolIndex = _.get(options.dynamicSettings, 'initialSolIndex');
        if (!_.isNil(initialSolIndex)) {
            args.push('-d', options.dynamicSettings.mode);
            args.push('-ds', initialSolIndex);
        }

        return _runJava(args, (data) => {
            const msg = data.trim().replace('\r\n', '');
            if (msg !== '') {
                options.dataHandler(msg);
            }
        }, options.errorHandler, options.endHandler);
    },
};

module.exports = (engineType) => {
    const engine = ENGINE[_.toLower(engineType)];

    if (!engine) {
        throw new Error(`Engine type ${engineType} is not supported`);
    }

    return {
        run: runWithJsonObjects(engine),
        formatSolution: engine.formatSolution,
    };
};

function runWithJsonObjects(selectedEngine) {
    return async function run(options, logger, endHandler) {
        const prefixFileName = `${options.problem._id}--${options.solutionId}--${options.engine}`;
        const inputFile = `${TEMP_FOLDER}/${vrpUtils.getFileName(`${prefixFileName}`, 'json')}`;
        const outputFile = `${TEMP_FOLDER}/${vrpUtils.getFileName(`${prefixFileName}-sol`, 'json')}`;
        const matrixFile = `${TEMP_FOLDER}/${vrpUtils.getFileName(prefixFileName, 'csv')}`;

        try {
            // check whether distance matrix is required (default: yes) - 2D doesn't need matrix
            const coordMode = _.get(options.problem, 'coord_mode', vrpEnum.CoordMode.REAL);
            if (vrpUtils.isSameText(coordMode, vrpEnum.CoordMode.REAL)) {
                // either query matrix on the fly or pass in matrix file
                if (options.matrixCSV) {
                    await vrpUtils.saveFile(options.matrixCSV, matrixFile);
                    options.matrix = matrixFile;
                } else {
                    options.matrix = `${global.serverAddress}/map/v2/distanceMatrix`;
                }
            }

            const inputData = selectedEngine.createInput(options.problem);
            if (!inputData) {
                throw new Error(`Cannot create input for ${_.get(options, 'problem._id')}`);
            } else {
                await vrpUtils.saveFile(inputData, inputFile);

                Object.assign(options, {
                    input: inputFile,
                    output: outputFile,
                    dataHandler: logger,
                    errorHandler: endHandler,
                    endHandler: async () => {
                        try {
                            const data = await vrpUtils.readFile(outputFile, true);
                            log.info(`<Engine> Read output ${outputFile} successfully`);
                            endHandler(null, JSON.parse(data));
                        } catch (err) {
                            endHandler(err);
                        }
                    },
                });

                const childProcess = selectedEngine.run(options);
                return childProcess;
            }
        } catch (err) {
            endHandler(err);
        }
    };
};

function _runJava(args, dataHandler, errorHandler, endHandler) {
    log.info(`<Engine> Running command: ${COMMAND} ${args.join(' ')}`);

    const child = process.spawn(COMMAND, args);

    const errors = []; // streams of errors in string

    child.on('error', _onError);
    child.stderr.on('data', _onError);

    child.stdout.on('data', (data) => {
        const dataMsg = data.toString();
        dataHandler(dataMsg);
    });

    child.on('exit', (code) => {
        log.info(`<Engine> Process exited with exit code ${code}`);
        if (code === 0 && _.isEmpty(errors)) {
            endHandler(code);
        } else {
            errorHandler(_.join(errors, '\n'));
        }
    });

    return child;

    function _onError(error) {
        const errorStack = error.toString();
        log.error('<Engine>', errorStack);

        // only pass informative error messages to errorHandler
        const messages = _.reduce(_.split(errorStack, '\r\n'), (list, message) => {
            // check if the message is informative (e.g. java.lang.ArrayIndexOutOfBoundsException: 0)
            if (_.includes(message, 'Exception: ') || _.includes(message, 'Reason: ')) {
                list.push(message);
            }
            return list;
        }, []);

        errors.push(...messages);
    }
}
