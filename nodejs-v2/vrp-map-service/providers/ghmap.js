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
const vrpConfig = require('../../configuration');

const URL = vrpConfig.get('map.graphhopper.url');

exports.measure = async (input) => {
    const options = {
        method: 'GET',
        uri: `${URL}/route?calc_points=false&instruction=false`,
        resolveWithFullResponse: true,
    };

    options.uri += `&point=${input.from_coord[0]},${input.from_coord[1]}&point=${input.to_coord[0]},${input.to_coord[1]}`;

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
            'ghmap-distance': _.get(result, 'paths[0].distance'),
            'ghmap-duration': _.get(result, 'paths[0].time', 0) / 1000,
        };
    } catch (err) {
        throw new Error(`Cannot measure between ${input.from} to ${input.to}. ${err}`);
    }
};

exports.route = async (points) => {
    const options = {
        method: 'GET',
        uri: `${URL}/route?calc_points=true&instruction=false&points_encoded=true&elevation=false`,
        resolveWithFullResponse: true,
    };

    _.each(points, (point) => {
        options.uri += `&point=${point[0]},${point[1]}`;
    });

    log.trace('route', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        }

        // convert to same as osrm format
        return {
            code: 'Ok',
            routes: _.map(result.paths, (route) => ({
                geometry: route.points,
                distance: route.distance,
                duration: (route.time || 0) / 1000,
                legs: [], // not supported
                waypoints: [], // not supported
            })),
        };
    } catch (err) {
        throw new Error(`Cannot find route between ${points.length} points. ${err}`);
    }
};
