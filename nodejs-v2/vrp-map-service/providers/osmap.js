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
const polyline = require('@mapbox/polyline');
const vrpMapUtils = require('../map-utils');
const vrpConfig = require('../../configuration');

const URL = vrpConfig.get('map.osrm.url');
const IS_NEW_OSRM = vrpConfig.get('map.osrm.new');
const COMPRESS_URL = vrpConfig.get('map.osrm.compressUrl');

function _correctDuration(distance) {
    const correctedDrivingDuration = 1.68 * Math.pow(0.9 * Math.pow(distance, 1.01) + 1075.55, 0.7) + 123;
    if (distance < 200) {
        const correctedWalkingDuration = (0.7539 * distance + 0.345) * 0.5;
        if (correctedWalkingDuration < correctedDrivingDuration) {
            // should walk
            return correctedWalkingDuration;
        }
    }
    return correctedDrivingDuration;
}

exports.measure = async (input) => {
    const options = {
        method: 'GET',
        uri: `${URL}/route/v1/driving/`,
        resolveWithFullResponse: true,
    };

    options.uri += `${input.from_coord[1]},${input.from_coord[0]};${input.to_coord[1]},${input.to_coord[0]}`;

    log.trace('measure', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        }

        const distance = _.get(result, 'routes[0].distance');

        return {
            from: input.from,
            to: input.to,
            'osmap-distance': distance,
            'osmap-duration': _correctDuration(distance),
        };
    } catch (err) {
        throw new Error(`Cannot measure between ${input.from} to ${input.to}. ${err}`);
    }
};

exports.route = async (points) => {
    const options = {
        method: 'GET',
        uri: `${URL}/route/v1/driving/`,
        resolveWithFullResponse: true,
    };

    options.uri += _.join(_.map(points, (point) => `${point[1]},${point[0]}`), ';');
    options.uri += '?overview=full';

    log.trace('route', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        }

        const legs = _.get(result, 'routes[0].legs');

        _.each(legs, (leg) => {
            leg.duration = _correctDuration(leg.distance);
        });

        return result;
    } catch (err) {
        throw new Error(`Cannot find route between ${points.length} points. ${err}`);
    }
};

exports.distanceMatrix = async (points) => {
    const options = {
        method: 'GET',
        uri: `${URL}/table/v1/driving/`,
        resolveWithFullResponse: true,
    };

    if (COMPRESS_URL) {
        options.uri += `polyline(${polyline.encode(points, 5)})`;
    } else {
        options.uri += _.join(_.map(points, (point) => `${point[1]},${point[0]}`), ';');
    }

    if (IS_NEW_OSRM) {
        options.uri += '?annotations=duration,distance';
    } else {
        options.uri += '?output_components=durations;distances';
    }

    log.trace('distanceMatrix', options);

    try {
        const response = await request(options);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        }

        const result = JSON.parse(response.body);

        const durationMatrix = result.durations;
        const distanceMatrix = result.distances;
        const greatCircleDistMatrix = new Array(durationMatrix.length);

        for (let i = 0; i < durationMatrix.length; i++) {
            greatCircleDistMatrix[i] = new Array(durationMatrix[i].length);

            for (let j = 0; j < durationMatrix[i].length; j++) {
                if (i !== j) {
                    greatCircleDistMatrix[i][j] = vrpMapUtils.calGreatCircleDist({
                        lat: points[i][0],
                        lon: points[i][1],
                    }, {
                        lat: points[j][0],
                        lon: points[j][1],
                    });

                    if (greatCircleDistMatrix[i][j] > (distanceMatrix[i][j] + 100)) { // if great circle distance > distance, result is wrong, location is probably disconnected
                        log.debug('greatDist > travelDistance + 100', i, j, ':', greatCircleDistMatrix[i][j], distanceMatrix[i][j]);
                        durationMatrix[i][j] = 999999999; // put a large number
                        distanceMatrix[i][j] = 999999999; // put a large number
                    } else {
                        durationMatrix[i][j] = _correctDuration(distanceMatrix[i][j]);
                    }
                } else {
                    greatCircleDistMatrix[i][j] = 0;
                }
            }
        }

        result.great_circle_distances = greatCircleDistMatrix;
        return result;
    } catch (err) {
        throw new Error(`Cannot calculate distance matrix for ${points.length} points. ${err}`);
    }
};
