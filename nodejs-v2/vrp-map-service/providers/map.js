/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');

const SERVICE = {
    gmap: require('./gmap'),
    osmap: require('./osmap'),
    onemap: require('./onemap'),
    ghmap: require('./ghmap'),
    bdmap: require('./bdmap'),
    sdmap: require('./sdmap'),
};

module.exports = (mapType) => {
    const mapService = SERVICE[_.toLower(mapType)];

    if (!mapService) {
        throw new Error(`Map service ${mapType} is not supported`);
    }

    return {
        route: _call(mapService, 'route'),
        measure: _call(mapService, 'measure'),
        geocode: _call(mapService, 'geocode'),
        distanceMatrix: _call(mapService, 'distanceMatrix'),
        searchAddress: _call(mapService, 'searchAddress'),
    };
};

function _call(service, method) {
    return function wrapper() {
        // check if map provider supports the request
        if (!service[method]) {
            throw new Error(`Map method ${method} is not supported`);
        }

        return service[method](...arguments);
    };
}
