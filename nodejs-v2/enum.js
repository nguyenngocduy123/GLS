/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

exports.RouterType = Object.freeze({
    AUTH_BY_TOKEN_ONLY: 'TOKEN', // token-based auth, no csrf
    NO_CSRF: 'API', // token/session auth, no csrf
    WITH_CSRF: 'CSRF', // token/session auth, with csrf
});

exports.SocketTopic = Object.freeze({
    DEFAULT: 'msg',
    ORDER: 'DeliveryMaster',
    JOB: 'DeliveryDetail',
    JOB_ITEM: 'DeliveryItem',
    PLAN: 'DeliveryPlan',
    ITEM: 'Item',
    VEHICLE: 'Vehicle',
    VEHICLE_LOG: 'VehicleLocationLog',
    VEHICLE_TYPE: 'VehicleType',
    MESSAGE: 'Message',
    LOGOUT: 'logout',
});

/**
 * @param {String} DATE  Date only based on ISO8601
 * @param {String} FILE_SAFE  Used to save as file name (Safe for Windows and Linux)
 * @param {String} ENGINE  Date format that engine reads in
 * @param {String} DISPLAY_TEXT  For display purposes only (i.e. not for processing)
 */
exports.DateFormat = Object.freeze({
    DATE: 'YYYY-MM-DD',
    FILE_SAFE: 'MMDDYYYY[_]HHmm',
    ENGINE: 'YYYY-MM-DDTHH:mmZ',
    DISPLAY_TEXT: 'DD MMM YYYY, hh:mm A',
});

exports.UserRole = Object.freeze({
    PLANNER: 'planner',
    DRIVER: 'driver',
    ADMIN: 'admin',
    DEFAULT: 'default',
    CONTROLLER: 'controller'
});

exports.CoordMode = Object.freeze({
    REAL: 'REAL',
    EUCLIDEAN: '2D',
});

exports.FleetSize = Object.freeze({
    FINITE: 'FINITE',
    INFINITE: 'INFINITE',
});
