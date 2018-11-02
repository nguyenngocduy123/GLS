'use strict';

const log = require('log4js').getLogger('MapService');

const _ = require('lodash');

function _deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// based on Singapore's postal codes, will prefix 0 if necessary and convert value to text
exports.normalizePostal = (postal) => _.padStart(postal, 6, '0');

exports.validateCoords = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (_.isNil(latitude) || Number.isNaN(latitude)) {
        throw new Error(`Latitude ${latitude} is invalid.`);

    } else if (_.isNil(longitude) || Number.isNaN(longitude)) {
        throw new Error(`Longitude ${longitude} is invalid.`);
    }
    return { lat, lng };
};

exports.isLatLonValid = (lat, lon) => {
    if (!lat || !lon || _.isNaN(_.toNumber(lat)) || _.isNaN(_.toNumber(lon))) {
        return false;
    } else {
        lat = _.toNumber(lat);
        lon = _.toNumber(lon);
        const isWithinSingapore = (lat > 1.206622 && lat < 1.481204) && (lon > 103.580887 && lon < 104.053299); // is in Singapore?
        const isWithinJakarta = (lat > -7.805105 && lat < -5.907808) && (lon > 106.411519 && lon < 108.738187); // is in Jakarta?
        const isWithinShanghai = (lat > 29.755791 && lat < 32.306632) && (lon > 119.229896 && lon < 122.927183); // is in Shanghai?
        const isWithinKuching = (lat > -2 && lat < 2.5) && (lon > 108 && lon < 113); // is in Kuching?
        return isWithinSingapore || isWithinJakarta || isWithinShanghai || isWithinKuching;
    }
};

/**
 * Convert measures (in JSON) to CSV string
 * @param {type} measures {from: ..,to: ...,distance: ..., duration:...}
 * @param {object} origins  todo
 * @returns {String} csv string
 */
exports.convertMeasuresToCSV = (measures, origins) => {
    log.debug('Converting distance matrix to CSV file');

    const durationMatrix = measures.durations;
    const distanceMatrix = measures.distances;

    const matrix = [];
    for (let i = 0; i < durationMatrix.length; i++) {
        for (let j = 0; j < durationMatrix[i].length; j++) {
            if (i !== j) {
                matrix.push({
                    from: origins[i].id,
                    to: origins[j].id,
                    duration: durationMatrix[i][j],
                    distance: distanceMatrix[i][j],
                });
            }
        }
    }

    const data = _.map(matrix, (m) => [m.from, m.to, m.distance, m.duration]);
    const csvData = _.concat([
        ['From', 'To', 'Distance', 'Duration'],
    ], data);

    return csvData.join('\n');
};

exports.calGreatCircleDist = (coord1, coord2) => {
    const R = 6371 * 1000; // radius of the earth in m
    const lon1 = coord1.lon;
    const lon2 = coord2.lon;
    const lat1 = coord1.lat;
    const lat2 = coord2.lat;
    const dLat = _deg2rad(lat2 - lat1);
    const dLon = _deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(_deg2rad(lat1)) * Math.cos(_deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // distance in m
    return d;
};
