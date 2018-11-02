/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

/*
 * Collection of functions to manipulate VRP problem and solution objects
 */
const log = require('log4js').getLogger('Problem');

const _ = require('lodash');
const moment = require('moment');
const vrpUtils = require('../vrp-common/utils');
const vrpMapUtils = require('../vrp-map-service/map-utils');
const vrpEngine = require('../vrp-engine');
const vrpEnum = require('../enum');

exports.TEMPLATE = Object.freeze({
    fleet_size: vrpEnum.FleetSize.FINITE,
    coord_mode: vrpEnum.CoordMode.REAL,
    username: [],
    date_format: vrpEnum.DateFormat.ENGINE,
    vehicles: [],
    vehicle_types: [],
    services: [],
    shipments: [],
    solutions: [],
    addresses: [],
    items: [{ id: 'unit1', weight: 1 }],
});

exports.updateFromAddresses = (problem) => {
    // update all addresses in [vehicles], [shipments] and [services] based on [addresses]
    _.each([
        problem.vehicles,
        problem.shipments,
        problem.services,
    ], (element) => {
        _.each(element, (property) => {
            _.each(property, (value, key) => {
                // check if key value pair is address
                if (_.includes(key, 'address')) {
                    if (value && value.id) {
                        const addressInProblem = _getAddressFromProblem(problem, value.id);
                        if (addressInProblem) { // if found, merging with new address
                            _.mergeWith(value, addressInProblem, (objVal, srcVal) => (!_.isNil(srcVal)) ? srcVal : objVal);
                        }
                    }
                }
            });
        });
    });
};

/**
 * Create new problem without [solutions] and remove all orders and vehicles with invalid addresses
 * Invalid addresses are addresses with no lat/lon or outside Singapore
 * @param {Object} inputProblem  Input JSON object of problem
 * @param {Object} options  todo
 * @param {String[]} options.username  List of usernames that can read the problem
 * @param {String[]} options.selectedVehicleIds  If specified, select only vehicles in the list and ignore the rest
 * @param {String[]} options.selectedOrderIds  If specified, select only orders in the list and ignore the rest
 * @returns {exports.createValidatedProblem.problem|Array|Object|nm$_n_problem_utils.exports.createValidatedProblem.problem}  todo
 */
exports.createValidatedProblem = (inputProblem, options = {}) => {
    const usernames = _.uniq(vrpUtils.toArray(options.username, inputProblem.username));
    const problem = Object.assign(
        {
            name: `p_${moment().format(vrpEnum.DateFormat.FILE_SAFE)}`,
        },
        this.TEMPLATE,
        _.cloneDeep(inputProblem), // get a copy of inputProblem
        {
            username: usernames,
            created_date: new Date(),
            modified_date: new Date(),
        },
    );

    problem.name = _.toString(problem.name);

    this.addAddressesToProblem(problem);

    _validateVehicles();

    _validateJobs();

    return problem;

    // private functions

    function _validateVehicles() {
        const reasons = [];
        _.remove(problem.vehicles, (vehicle) => {
            const invalid = { vehicle_id: vehicle.id, reason: undefined };

            if (options.selectedVehicleIds && !options.selectedVehicleIds.includes(vehicle.id)) {
                invalid.reason = 'vehicle id not in selectedVehicleIds list';

            } else if (!_isAddressValid(vehicle.start_address)) {
                invalid.reason = 'vehicle start_address is invalid';

            } else if (vehicle.end_address && !_isAddressValid(vehicle.end_address)) {
                invalid.reason = 'vehicle end_address is invalid';
            }

            if (invalid.reason) {
                reasons.push(invalid);
                return true;
            }
        });

        if (!_.isEmpty(reasons)) {
            _.set(problem, 'ignored.vehicles.reasons', reasons);
            _.set(problem, 'ignored.vehicles.list', _.map(reasons, 'vehicle_id'));
        }
    }

    function _validateJobs() {
        const reasons = [];
        _.remove(problem.shipments, (shipment) => {
            const invalid = { job_id: shipment.id, reason: undefined };

            if (options.selectedOrderIds && !options.selectedOrderIds.includes(shipment.id)) {
                invalid.reason = 'shipment id not in selectedOrderIds list';

            } else if (!_isAddressValid(shipment.pickup_address)) {
                invalid.reason = 'shipment pickup_address is invalid';

            } else if (!_isAddressValid(shipment.delivery_address)) {
                invalid.reason = 'shipment delivery_address is invalid';
            }

            if (invalid.reason) {
                reasons.push(invalid);
                return true;
            }
        });

        _.remove(problem.services, (service) => {
            const invalid = { job_id: service.id, reason: undefined };

            if (options.selectedOrderIds && !options.selectedOrderIds.includes(service.id)) {
                invalid.reason = 'service id not in selectedOrderIds list';

            } else if (!_isAddressValid(service.address)) {
                invalid.reason = 'service address is invalid';
            }

            if (invalid.reason) {
                reasons.push(invalid);
                return true;
            }
        });

        if (!_.isEmpty(reasons)) {
            _.set(problem, 'ignored.jobs.reasons', reasons);
            _.set(problem, 'ignored.jobs.list', _.map(reasons, 'job_id'));
        }
    }

    function _isAddressValid(address) {
        if (!address) {
            return false;
        } else if (address && vrpMapUtils.isLatLonValid(address.lat, address.lon)) {
            return true;
        } else if (address.id) {
            const { lat, lon } = _getAddressFromProblem(problem, address.id);
            return vrpMapUtils.isLatLonValid(lat, lon);
        } else {
            return false;
        }
    }
};

/**
 * Scan addresses of [services], [vehicles] and [shipments] and add/update to [addresses].
 * Remove duplicate and redundant [addresses] from [problem].
 * @param {Object} problem  Input JSON object of problem
 * @return {Object} Array of new addresses
 */
exports.addAddressesToProblem = (problem) => {
    let processedAddressId = [];

    problem.addresses = _.uniqBy(problem.addresses, 'id'); // remove duplicated addresses

    // search all addresses in [vehicles], [shipments] and [services] and add to [addresses]
    _.each([
        problem.vehicles,
        problem.shipments,
        problem.services,
    ], (element) => {
        _.each(element, (property) => {
            _.each(property, (value, key) => {
                // check if key value pair is address
                if (_.includes(key, 'address') && value) {
                    _processAddress(value);
                }
            });
        });
    });

    processedAddressId = _.uniq(processedAddressId);

    // remove used addresses
    _.remove(problem.addresses, (address) => _.indexOf(processedAddressId, address.id) < 0);

    return problem.addresses;

    /**
     * Adds new address to `problem.addresses`
     * @param {Object} address  Engine `address` type
     * @returns {void}
     */
    function _processAddress(address) {
        // either postal or lat/lon is required
        if (address.postal || (address.lat && address.lon)) {
            address.id = _getAddressFromProblemId(address); // get or set id
            address.postal = _.isNil(address.postal) ? undefined : vrpMapUtils.normalizePostal(address.postal); // ensure postal code is 6 digit
            address.lat = _.isNil(address.lat) ? undefined : _.toNumber(address.lat);
            address.lon = _.isNil(address.lon) ? undefined : _.toNumber(address.lon);

            const existingAddress = _getAddressFromProblem(problem, address.id);
            if (!existingAddress) {
                problem.addresses.push(address); // if existing address does not exist, add to [addresses]
            }

            // add id to list to indicate that address has been processed before
            processedAddressId.push(address.id);
        }
    }

    /**
     * Get `id` for `address` object. Returns `id` as is if it is specified.
     * If `id` is not specified, check if coordinates is in list of addresses.
     * Otherwise, generate a new id.
     * @param {Object} address  Engine `address` type
     * @returns {String}  `id` for `address` object
     */
    function _getAddressFromProblemId(address) {
        // if specified, use `id` as is
        if (address.id) {
            return address.id;
        }

        const existingAddress = _.find(problem.addresses, { lat: address.lat, lon: address.lon }); // find in [addresses]

        if (existingAddress) {
            // reuse id of existing address in [addresses] list
            return existingAddress.id;
        } else {
            // create new id
            return `id-${address.lat}-${address.lon}`;
        }
    }
};

exports.addAddressesToSolution = (problem, solution) => {
    if (!solution) {
        throw new Error('Solution does not exist');
    }

    _.each(solution.routes, (route) => {
        _.each(route.act, (act) => {
            // set jobs information
            if (act.job_prop === 'service') {
                const service = _getServiceFromProblem(problem, act.job_id);

                act.job_time_window = service.time_window;
                act.job_time_windows = service.time_windows;
                act.address = _getAddressFromProblem(problem, service.address.id);
                act.job_name = service.name;
                act.job_size = service.size;

            } else if (act.job_prop === 'shipment') {
                const shipment = _getShipmentFromProblem(problem, act.job_id);

                if (_.includes(act.type, 'pickup')) {
                    act.type = 'pickup';
                    act.job_time_window = shipment.pickup_time_windows || shipment.pickup_time_window;
                    act.pickup_time_windows = shipment.pickup_time_window;
                    act.address = _getAddressFromProblem(problem, shipment.pickup_address.id);
                } else if (_.includes(act.type, 'deliver')) {
                    act.type = 'delivery';
                    act.job_time_window = shipment.delivery_time_window;
                    act.job_time_windows = shipment.delivery_time_windows;
                    act.address = _getAddressFromProblem(problem, shipment.delivery_address.id);
                }
                act.job_name = shipment.name;
                act.job_size = shipment.size;
            } else {
                // log.warn(`addAddressesToSolution, job ${act.job_id} not found`);
            }
        });

        // set vehicle information
        const vehicle = _getVehicleFromProblem(problem, route.vehicle_id);
        if (vehicle) {
            route.start_address = _getAddressFromProblem(problem, vehicle.start_address.id);

            if (vehicle.return_to_depot) {
                route.end_address = _getAddressFromProblem(problem, vehicle.end_address.id);
            }
        } else {
            // log.warn(`addAddressesToSolution, vehicle ${route.vehicle_id} not found`);
        }
    });
};

/**
 * Perform optimization using vrp-engine
 * @param {Object} problem  Input JSON object of problem
 * @param {Object} options  Settings for optimization
 * @param {Function} logger  Logger callback to inform the progress
 * @param {Function} endHandler  End callback
 * @returns {void}
 */
exports.optimize = async (problem, options, logger, endHandler) => {
    const stopWatch = new vrpUtils.StopWatch();

    try {
        const engine = vrpEngine(options.engine);

        const validatedProblem = this.createValidatedProblem(_.omit(problem, ['solutions']), options); // exclude invalid orders and vehicles

        if (!validatedProblem.vehicles) {
            throw new Error(`No vehicles to optimise with. Ignored: ${validatedProblem.ignored}`);

        } else if (!validatedProblem.vehicle_types) {
            throw new Error(`No vehicle types to optimise with. Ignored: ${validatedProblem.ignored}`);

        } else if (!(validatedProblem.shipments && validatedProblem.services)) {
            throw new Error(`No jobs to optimise with. Ignored: ${validatedProblem.ignored}`);
        }

        _processDynamicSetting(validatedProblem);

        // for 2D problem, no need to calculate distance matrix (i.e. problem.coord_mode === '2D')
        // current distance matrix implementation only queries from osmap (engine calls api on the fly)
        // otherwise, have to implement function that uses vrpMapUtils.convertMeasuresToCSV() and pass in runOptions.matrixCSV

        const childProcess = await _runSolver(engine, validatedProblem);
        return childProcess;
    } catch (err) {
        endHandler(err);
    }

    function _customLogger(message) {
        if (!message) {
            return message;
        }

        // add time to log messages
        const messageWithTime = `${stopWatch.getDuration()} - ${_.trimEnd(message, '\r\n')}`;
        log.trace(`Optimizing [${problem._id},${problem.solutionId}]: ${messageWithTime}`);
        logger(messageWithTime);
    }

    function _customEndHandler() {
        _customLogger(null);
        endHandler(...arguments);
    }

    function _processDynamicSetting(validatedProblem) {
        _customLogger('Processing dynamic settings');

        // handle input for dynamic optimization (3 ways to indicate: initialSolId, initialSolIndex, initialSol)
        const initialSolId = _.get(options, 'dynamicSettings.initialSolId');
        const initialSolIndex = _.get(options, 'dynamicSettings.initialSolIndex');
        const initialSol = _.get(options, 'dynamicSettings.initialSol');

        let initialSolution;
        if (!_.isNil(initialSolId)) {
            initialSolution = _.find(problem.solutions, { id: initialSolId });

        } else if (!_.isNil(initialSolIndex)) {
            initialSolution = _.first(problem.solutions);

        } else if (!_.isNil(initialSol)) {
            initialSolution = initialSol;
        }

        if (initialSolution) {
            // ensure solutions array will only have one solution
            validatedProblem.solutions = [initialSolution];
        }
    }

    async function _runSolver(engine, validatedProblem) {
        _customLogger(`Solving using ${options.engine} solver`);

        const runOptions = Object.assign({}, options, { problem: validatedProblem });

        const childProcess = await engine.run(runOptions, _customLogger, (err, solution) => {
            // end handler
            if (err) {
                _customEndHandler(err);
            } else if (!solution) {
                _customEndHandler(`Failed to optimize model ${validatedProblem._id}`);
            } else {
                _processSolution(engine, validatedProblem, solution);
                _customEndHandler(null, solution);
            }
        });

        return childProcess;
    }

    function _processSolution(engine, validatedProblem, solution) {
        _customLogger('Processing solution');

        engine.formatSolution(solution);

        solution.id = options.solutionId;
        solution.constraints = options.constraints;
        solution.engine = options.engine;
        solution.calc_duration = stopWatch.getDurationAsSeconds(); // add calculation time
        solution.calc_date = new Date();

        const numServices = _.get(validatedProblem, 'services.length', 0);
        const numShipments = _.get(validatedProblem, 'shipments.length', 0);
        solution.no_total_orders = numServices + numShipments;

        solution.ignored = validatedProblem.ignored; // ignored fields = objects that fail validation stage
    }
};

function _getVehicleFromProblem(problem, vehicleId) {
    return _.find(problem.vehicles, { id: vehicleId });
}

function _getServiceFromProblem(problem, jobId) {
    return _.find(problem.services, { id: jobId });
}

function _getShipmentFromProblem(problem, jobId) {
    return _.find(problem.shipments, { id: jobId });
}

function _getAddressFromProblem(problem, addressId) {
    return _.find(problem.addresses, { id: addressId });
}
