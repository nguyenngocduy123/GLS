/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');

const PREFIX_ALLOWED_VEHICLE = '';
const PREFIX_BLOCKED_VEHICLE = '#';
const PREFIX_ALLOWED_VEHICLETYPE = '@';
const PREFIX_BLOCKED_VEHICLETYPE = '#@';
const DELIMITER_VEHICLE_RESTRICTION = ',';

/**
 * Check if an order is assigned to any driver.
 *
 * @param {object} order  Instance of DeliveryDetail table
 * @param {object} order.VehicleId  todo
 * @returns {Boolean}  todo
 */
exports.isAssigned = (order) => !_.isNil(order.VehicleId);

/**
 * @typedef {object} restrictionGroup
 * @property {String[]} allowedVehicles  Allowed vehicles
 * @property {String[]} blockedVehicles  Blocked vehicles
 * @property {String[]} allowedVehicleTypes  Allowed vehicles types
 * @property {String[]} blockedVehicleTypes  Blocked vehicles types
 */
/**
 * Group VehicleRestriction column in DeliveryMaster table into different categories
 *
 * @param {String} restriction  Value of VehicleRestriction column in DeliveryMaster table
 * @returns {restrictionGroup}  todo
 */
exports.groupVehicleRestriction = (restriction) => {
    const response = {
        allowedVehicles: [],
        blockedVehicles: [],
        allowedVehicleTypes: [],
        blockedVehicleTypes: [],
    };

    restriction = _.compact(_.split(_.trim(restriction), DELIMITER_VEHICLE_RESTRICTION));
    _.each(restriction, (text) => {
        text = _.trim(text);

        if (_.startsWith(text, PREFIX_BLOCKED_VEHICLETYPE)) {
            response.blockedVehicleTypes.push(removePrefix(text, PREFIX_BLOCKED_VEHICLETYPE));

        } else if (_.startsWith(text, PREFIX_ALLOWED_VEHICLETYPE)) {
            response.allowedVehicleTypes.push(removePrefix(text, PREFIX_ALLOWED_VEHICLETYPE));

        } else if (_.startsWith(text, PREFIX_BLOCKED_VEHICLE)) {
            response.blockedVehicles.push(removePrefix(text, PREFIX_BLOCKED_VEHICLE));

        } else {
            response.allowedVehicles.push(removePrefix(text, PREFIX_ALLOWED_VEHICLE));
        }
    });

    return response;

    function removePrefix(text, prefix) {
        return _.toUpper(_.join(_.slice(text, prefix.length, text.length), ''));
    }
};
