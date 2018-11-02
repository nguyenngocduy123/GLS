/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('MapService');

const _ = require('lodash');
const request = require('request-promise');
const vrpMapUtils = require('../map-utils');

const TOKEN = '';

exports.searchAddress = async (address) => {
    const options = {
        method: 'GET',
        uri: `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${TOKEN}`,
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

        return _.reduce(result.results, (list, geolocation) => {
            const coords = _.get(geolocation, 'geometry.location');
            const { lat, lng } = vrpMapUtils.validateCoords(coords.lat, coords.lng);

            if (coords) {
                list.push({
                    full_address: address,
                    address: geolocation.formatted_address,
                    'gmap-lat': lat,
                    'gmap-lon': lng,
                });
            }
            return list;
        }, []);
    } catch (err) {
        throw new Error(`${address} cannot be found. ${err}`);
    }
};

exports.measure = async (input) => {
    const options = {
        method: 'GET',
        uri: `https://maps.googleapis.com/maps/api/distancematrix/json?key=${TOKEN}`,
        resolveWithFullResponse: true,
    };

    options.uri += `&origins=${input.from_coord[0]},${input.from_coord[1]}&destinations=${input.to_coord[0]},${input.to_coord[1]}`;

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
            'gmap-duration': _.get(result, 'rows[0].elements[0].duration.value'),
            'gmap-distance': _.get(result, 'rows[0].elements[0].distance.value'),
        };
    } catch (err) {
        throw new Error(`Cannot measure between ${input.from} to ${input.to}. ${err}`);
    }
};
