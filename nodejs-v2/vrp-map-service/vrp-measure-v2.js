/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology  All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('MapService');

const _ = require('lodash');
const vrpMapUtils = require('./map-utils');
const vrpMongo = require('../vrp-common/mongo');
const vrpUtils = require('../vrp-common/utils');
const mapProviders = require('./providers/map');

let colLocation;

exports.setup = vrpUtils.setupOnce(this, async (mongoDb) => {
    colLocation = await vrpMongo.getCollection(mongoDb, 'location');
});

exports.m_route = async (req, res, next) => {
    log.debug('m_route', _.get(req, 'user.username'));

    const mapType = _.get(req.query, 'service', 'osmap');
    const coordinates = _.get(req.body, 'coordinates');

    try {
        // validation
        if (_.isEmpty(coordinates)) {
            throw new Error('Parameter `coordinates` is required.');
        } else if (coordinates.length < 2) {
            throw new Error('At least 2 pairs of coordinates required.');
        }

        const result = await mapProviders(mapType).route(coordinates);
        req.answer = result;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_searchSimilarAddress = async (req, res, next) => {
    log.debug('m_searchAddress', _.get(req, 'user.username'));

    const mapType = _.get(req.query, 'service', 'onemap'); // only required for address
    const postal = _.get(req.query, 'postal');
    const address = _.get(req.query, 'address');

    try {
        // validation
        if (_.isNil(postal) && _.isNil(address)) {
            throw new Error('Either parameter `postal` or `address` is required.');
        } else if (postal && !colLocation) {
            throw new Error('colLocation is not found in database.');
        }

        if (postal) {
            const response = await colLocation.find({
                postal: {
                    $regex: `${postal}`,
                },
            }, {
                projection: {
                    _id: 0,
                    postal: 1,
                    'user-lat': 1,
                    'user-lon': 1,
                    [`${mapType}-lat`]: 1,
                    [`${mapType}-lon`]: 1,
                },
            }).limit(20).toArray();

            req.answer = _.uniqBy(response, 'postal');

        } else if (address) {
            const response = await mapProviders(mapType).searchAddress(address);
            req.answer = response;
        }

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_searchAddressInDb = async (req, res, next) => {
    log.debug('m_searchAddressInDb', _.get(req, 'user.username'));

    const preferredMapType = _.get(req.query, 'service', 'onemap');
    const alternativeMaps = _.split(_.get(req.query, 'alternativeServices'));
    const addresses = _.get(req.body, 'addresses', []);

    const maps = _.compact(['user', preferredMapType, ...alternativeMaps]);

    try {
        // validation
        if (_.isEmpty(addresses)) {
            throw new Error('Parameter `addresses` is required.');
        } else if (!colLocation) {
            log.warn('colLocation is not found in database.');
            req.answer = addresses;
            next();
        }

        // extract postal codes and addresses from input
        const [postals, fullAddresses] = _.reduce(addresses, (list, address) => {
            const postal = vrpMapUtils.normalizePostal(address.postal);

            if (address.postal && !_.includes(list[0], postal)) {
                list[0].push(postal);
            }
            if (address.full_address && !_.includes(list[1], address.full_address)) {
                list[1].push(vrpMongo.toCaseInsensitiveRegex(address.full_address));
            }
            return list;
        }, [[], []]);

        // mongodb query
        const filterOptions = {
            $or: [
                { postal: { $in: postals } },
                { full_address: { $in: fullAddresses } },
            ],
        };

        log.trace('m_searchAddressInDb', maps, filterOptions);

        const foundLocs = await colLocation.find(filterOptions).toArray();

        log.debug(`Found ${(foundLocs) ? foundLocs.length : 0} location records in database`);

        // set lat lon values in addresses
        _updateLatLngInAddress(addresses, foundLocs, maps);
        req.answer = addresses;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_geocode = async (req, res, next) => {
    log.debug('m_geocode', _.get(req, 'user.username'));

    const preferredMapType = _.get(req.query, 'service', 'onemap');
    const alternativeMaps = _.split(req.query.alternativeServices);
    const saveToDb = _.get(req.query, 'saveToDb', false);
    const addresses = _.get(req.body, 'addresses');

    const maps = ['user', preferredMapType, ...alternativeMaps];

    try {
        // validation
        if (_.isEmpty(addresses)) {
            throw new Error('Parameter `addresses` is required.');
        }

        // get addresses that do not have valid coordinates from input
        const missingAddresses = _.filter(addresses, (address) => _.isNil(address.lat) || _.isNil(address.lon));

        log.debug(`Query ${missingAddresses.length} locations using ${preferredMapType}`);
        log.trace(missingAddresses);

        const bulk = (saveToDb && colLocation) ? colLocation.initializeUnorderedBulkOp() : null;

        const foundLocs = [];

        // throttle requests (one at a time)
        for (const address of missingAddresses) {
            try {
                if (address.postal) {
                    // query based on postal code
                    const response = await mapProviders('onemap').geocode(address.postal);

                    if (response) {
                        foundLocs.push(response);
                    }

                    if (bulk) {
                        bulk.find({ postal: vrpMapUtils.normalizePostal(address.postal) }).upsert().updateOne({ $set: response });
                    }
                } else if (address.full_address) {
                    // query based on address
                    const response = await mapProviders(preferredMapType).searchAddress(address.full_address);

                    if (response && response[0]) {
                        foundLocs.push(response[0]);
                    }

                    if (bulk) {
                        bulk.find({ full_address: vrpMongo.toCaseInsensitiveRegex(address.full_address) }).upsert().updateOne({ $set: response[0] });
                    }
                }
            } catch (err) {
                log.error(err); // silence error (no error thrown)
            }
        }

        log.debug(`Queried ${foundLocs.length} locations`);
        log.trace(foundLocs);

        _updateLatLngInAddress(addresses, foundLocs, maps);
        req.answer = addresses;

        next();

        // update database after next (i.e. background update)
        const hasBulkOperations = _.get(bulk, 's.currentBatch.operations.length') > 0;
        if (hasBulkOperations) {
            try {
                const result = await bulk.execute();
                log.trace(`Save ${result.nUpserted + result.nModified} records to database`);
            } catch (err) {
                log.error(err); // silence error (no error thrown)
            }
        }
    } catch (err) {
        next(err);
    }
};

/**
 * Get distance matrix between coordinates. Results is saved in `req.answer`
 * @see https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md#table-service
 *
 * @param {object} req  Express request object
 * @param {object} res  Express response object
 * @param {object} next  Express next middleware function
 * @param {Array.<[Float, Float]>} req.body.coordinates  Array of coordinates in `[LAT, LNG]` format
 * @param {Array.<[Integer]>} req.query.sources  Array of index of element in `coordinates` as source
 * @param {Array.<[Integer]>} req.query.destinations  Array of index of element `coordinates` as destination
 * @returns {void}
 *
 * @example `req.query` = `{ sources: [0], destinations: [1,2] }` // measure from point 0 to 1, point 0 to 2
 */
exports.m_distanceMatrixOnTheFly = async (req, res, next) => {
    log.debug('m_distanceMatrixOnTheFly', _.get(req, 'user.username'));

    const coordinates = _.get(req.body, 'coordinates');

    try {
        // validation
        if (_.isEmpty(coordinates)) {
            throw new Error('Parameter `coordinates` is required.');
        }

        const result = await mapProviders('osmap').distanceMatrix(coordinates);
        req.answer = result;

        next();
    } catch (err) {
        next(err);
    }
};

exports.m_upsertUserLatLon = async (req, res, next) => {
    log.debug('m_upsertUserLatLon', _.get(req, 'user.username'));

    const addresses = vrpUtils.toArray(_.get(req.body, 'addresses'));

    try {
        _validation();
        const response = await _insertDatabase();

        req.answer = _.sumBy(response, 'upsertedCount') + _.sumBy(response, 'matchedCount');
        next();
    } catch (err) {
        next(err);
    }

    function _validation() {
        if (_.isEmpty(addresses)) {
            throw new Error('Parameter `addresses` is required.');

        } else if (addresses.length !== _.uniqBy(addresses, 'postal').length) {
            throw new Error('`addresses` cannot contain duplicates (i.e. address with same postal)');
        }

        _.each(addresses, (address) => {
            address.postal = _.toString(address.postal);

            if (!address.postal) {
                throw new Error(`Postal is missing from ${JSON.stringify(address)}`);

            } else if (address.postal.length !== 6) {
                throw new Error(`Invalid postal length ${address.postal}`);

            } else if (!vrpMapUtils.isLatLonValid(address.lat, address.lon || address.lng)) {
                throw new Error(`Invalid coordinates. (Lat ${address.lat}, Lng ${address.lon || address.lng})`);
            }
        });
    }

    async function _insertDatabase() {
        const addressErrors = []; // list of addresses that cannot be updated/inserted

        const promises = _.map(addresses, (address) => {
            try {
                const { lat, lng } = vrpMapUtils.validateCoords(address.lat, address.lon || address.lng);

                return colLocation.updateOne({
                    postal: vrpMapUtils.normalizePostal(address.postal),
                }, {
                    $set: {
                        'user-lat': lat,
                        'user-lon': lng,
                    },
                }, {
                    upsert: true,
                });
            } catch (err) {
                addressErrors.push(`Postal ${address.postal} cannot be upserted. ${err}`);
            }
        });

        const response = await Promise.all(promises);

        // return errors if any
        if (!_.isEmpty(addressErrors)) {
            throw addressErrors;
        } else {
            return response;
        }
    }
};

exports.m_deleteUserLatLon = async (req, res, next) => {
    log.debug('m_deleteUserLatLon', _.get(req, 'user.username'));

    const postal = _.get(req.params, 'postal');

    try {
        const query = { postal: vrpMapUtils.normalizePostal(postal) };

        const response = await colLocation.findOneAndUpdate(query, {
            $unset: {
                'user-lat': 1,
                'user-lon': 1,
            },
        }, {
            returnOriginal: false,
        });

        const success = response.ok;
        log.trace(`Unset user coords for postal ${postal}, success: ${!!success}`);

        if (!success) {
            throw new Error(`No user-specified coordinates for ${postal}. Fail to remove from database.`);

        } else if (_.size(response.value) === 2) {
            // delete the entire record if it does not contain any lat and lng values
            await colLocation.deleteOne(query);
        }

        req.answer = success;
        next();
    } catch (err) {
        next(err);
    }
};

function _updateLatLngInAddress(addresses, foundLocs, mapPreference) {
    _.each(addresses, (address, i) => {
        const foundLoc = _.find(foundLocs, (location) => {
            if (address.postal && location.postal) {
                // normalize postal is required in case postal input is number or length !== 6
                return (vrpUtils.isSameText(vrpMapUtils.normalizePostal(address.postal), location.postal));

            } else if (address.full_address && location.full_address) {
                return (vrpUtils.isSameText(address.full_address, location.full_address));
            }
        });

        if (foundLoc) {
            // get the coordinates based on map preference
            for (let i = 0; i < mapPreference.length; i++) {
                const map = mapPreference[i];
                const lat = parseFloat(foundLoc[`${map}-lat`]);
                const lon = parseFloat(foundLoc[`${map}-lon`]);

                if (lat && lon) {
                    address.lat = lat;
                    address.lon = lon;
                    break;
                }
            }
        }
    });
};
