/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('MapService');

const _ = require('lodash');
const vrpMapUtils = require('../map-utils');
const request = require('request-promise');

const COUNTRY = 'Singapore';
const TOKEN = 'qo/s2TnSUmfLz+32CvLC4RMVkzEFYjxqyti1KhByvEacEdMWBpCuSSQ+IFRT84QjGPBCuz/cBom8PfSm3GjEsGc8PkdEEOEr';

exports.measure = async (input) => {
    const options = {
        method: 'GET',
        uri: `https://developers.onemap.sg/privateapi/routingsvc/route?token=${TOKEN}&routemode=DRIVE`,
        resolveWithFullResponse: true,
    };

    options.uri += `&start=${input.from_coord[0]},${input.from_coord[1]}&end=${input.to_coord[0]},${input.to_coord[1]}`;

    log.trace('measure', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        }

        return {
            from: input.from,
            to: input.to,
            'onemap-duration': parseFloat(_.get(result, 'directions[0].summary.totalTime')),
            'onemap-distance': parseFloat(_.get(result, 'directions[0].summary.totalLength')),
        };
    } catch (err) {
        throw new Error(`Cannot measure between ${input.from} to ${input.to}. ${err}`);
    }
};

exports.searchAddress = async (address) => {
    const options = {
        method: 'GET',
        uri: `https://developers.onemap.sg/commonapi/search?searchVal=${encodeURIComponent(address)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`,
        resolveWithFullResponse: true,
    };

    log.trace('searchAddress', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        } else if (_.isEmpty(result.results)) {
            throw new Error('No relevant results');
        }

        return _.map(result.results, (location) => {
            const { lat, lng } = vrpMapUtils.validateCoords(location.LATITUDE, location.LONGITUDE);

            return {
                full_address: address,
                address: location.ADDRESS,
                'onemap-lat': lat,
                'onemap-lon': lng,
            };
        });
    } catch (err) {
        throw new Error(`${address} cannot be found. ${err}`);
    }
};

exports.geocode = async (postal) => {
    const validPostal = vrpMapUtils.normalizePostal(postal);
    const response = await this.searchAddress(`${COUNTRY} ${validPostal}`);

    const result = _.first(response);

    if (!result) {
        return null;
    } else {
        result.postal = validPostal;
        return _.omit(result, 'full_address');
    }
};
