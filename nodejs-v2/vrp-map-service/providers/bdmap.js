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

const TOKEN = 'KNztaC1OykDGlxL9fazp1MhpGGiyZQAn';

exports.searchAddress = async (address) => {
    const options = {
        method: 'GET',
        uri: `http://api.map.baidu.com/geocoder/v2/?address=${encodeURIComponent(address)}&output=json&ak=${TOKEN}`,
        resolveWithFullResponse: true,
    };

    log.trace('searchAddress', options);

    try {
        const response = await request(options);

        const result = JSON.parse(response.body);

        if (response.statusCode !== 200) {
            throw new Error(`Error status code ${response.statusCode}`);
        } else if (result.status !== 0) {
            throw new Error('No relevant results');
        }

        const location = _.get(result, 'result.location');
        const { lat, lng } = vrpMapUtils.validateCoords(location.lat, location.lng);

        if (!location) {
            return null;
        } else {
            return [{
                full_address: address, // baidu map does not return address
                'bdmap-lat': lat,
                'bdmap-lon': lng,
            }];
        }
    } catch (err) {
        throw new Error(`${address} cannot be found. ${err}`);
    }
};
