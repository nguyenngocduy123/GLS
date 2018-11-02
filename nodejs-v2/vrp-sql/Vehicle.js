/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const moment = require('moment');
const vrpUtils = require('../vrp-common/utils');

const TIME_FORMAT = 'HH:mm';

module.exports = (sequelize, DataTypes) => {
    const Vehicle = sequelize.define('Vehicle', {
        Id: {
            primaryKey: true,
            type: DataTypes.STRING(50),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                is: {
                    args: ['^[A-Za-z0-9-_ ]+$', 'i'],
                    msg: 'Id cannot contain symbols other than dashes, underscores and spaces.',
                },
                not: {
                    args: ['^(location|type)$', 'i'], // Invalid because of API path for other Entities
                    msg: 'Id cannot be `location` or `type` (without backtick).',
                },
                len: {
                    args: [1, 50],
                    msg: 'Id must be within 50 characters.',
                },
            },
        },
        VehicleTypeId: {
            type: DataTypes.INTEGER,
            references: {
                model: {
                    tableName: 'VehicleType',
                    schema: sequelize.options.define.schema,
                },
                key: 'Id',
            },
            allowNull: false,
        },
        PlateNumber: {
            type: DataTypes.STRING(10),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                is: {
                    args: ['^[A-Za-z0-9-]+$', 'i'],
                    msg: 'PlateNumber can contain letters, numbers and dashes only.',
                },
                len: {
                    args: [1, 10],
                    msg: 'PlateNumber must be within 10 characters.',
                },
            },
        },
        StartAddressPostal: {
            type: DataTypes.STRING(6),
            allowNull: false,
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'StartAddressPostal code must contain numbers only.',
                },
                len: {
                    args: '6',
                    msg: 'StartAddressPostal must have a length of 6 characters.',
                },
            },
        },
        StartAddressLat: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        min: -90,
                        max: 90,
                    },
                    msg: 'StartAddressLat must be a Number between -90 and 90.',
                },
            },
        },
        StartAddressLng: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        min: -180,
                        max: 180,
                    },
                    msg: 'StartAddressLng must be a Number between -180 and 180.',
                },
            },
        },
        EndAddressPostal: {
            type: DataTypes.STRING(6),
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'EndAddressPostal code must contain numbers only.',
                },
                len: {
                    args: '6',
                    msg: 'EndAddressPostal must have a length of 6 characters.',
                },
            },
        },
        EndAddressLat: {
            type: DataTypes.FLOAT,
            validate: {
                isFloat: {
                    args: {
                        min: -90,
                        max: 90,
                    },
                    msg: 'EndAddressLat must be a Number between -90 and 90.',
                },
            },
        },
        EndAddressLng: {
            type: DataTypes.FLOAT,
            validate: {
                isFloat: {
                    args: {
                        min: -180,
                        max: 180,
                    },
                    msg: 'EndAddressLng must be a Number between -180 and 180.',
                },
            },
        },
        ReturnToEndAddress: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        DriverUsername: {
            type: DataTypes.STRING(100),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 100],
                    msg: 'DriverUsername must be within 100 characters.',
                },
            },
        },
        StartTime: {
            type: DataTypes.TIME,
            allowNull: false,
            get(key) {
                return getTimeOnly(this.getDataValue(key));
            },
        },
        EndTime: {
            type: DataTypes.TIME,
            allowNull: false,
            get(key) {
                return getTimeOnly(this.getDataValue(key));
            },
        },
        MaxNumJobs: {
            type: DataTypes.INTEGER,
            defaultValue: 1000,
            isInt: {
                args: {
                    gt: 0,
                },
                msg: 'MaxNumJobs must be an Integer greater than 0.',
            },
        },
        UserGroup: {
            type: DataTypes.STRING(100),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
        },
    }, {
        validate: {
            startAddr() {
                if (this.getDataValue('StartAddressPostal') && (_.isNil(this.getDataValue('StartAddressLat')) || _.isNil(this.getDataValue('StartAddressLng')))) {
                    throw new Error('StartAddressLat & StartAddressLng are required when StartAddressPostal is specified.');
                }
            },
            endAddr() {
                if (this.getDataValue('EndAddressPostal') && (_.isNil(this.getDataValue('EndAddressLat')) || _.isNil(this.getDataValue('EndAddressLng')))) {
                    throw new Error('EndAddressLat & EndAddressLng are required when EndAddressPostal is specified.');
                }
            },
            endAddrOrNone() {
                if (this.getDataValue('ReturnToEndAddress') && _.isNil(this.getDataValue('EndAddressPostal'))) {
                    throw new Error('EndAddressPostal is required when ReturnToEndAddress is true.');
                }
            },
            startTimeFormat() {
                const time = this.getDataValue('StartTime');
                if (!_.isNil(time) && moment(time, TIME_FORMAT, true).isValid() === false) {
                    throw new Error(`StartTime ${time} must be in ${TIME_FORMAT} (24-hour format).`);
                }
            },
            endTimeFormat() {
                const time = this.getDataValue('EndTime');
                if (!_.isNil(time) && moment(time, TIME_FORMAT, true).isValid() === false) {
                    throw new Error(`EndTime ${time} must be in ${TIME_FORMAT} (24-hour format).`);
                }
            },
            validateTime() {
                const startTime = this.getDataValue('StartTime');
                const endTime = this.getDataValue('EndTime');
                if (!_.isNil(startTime) && !_.isNil(endTime) && moment(endTime, TIME_FORMAT).diff(moment(startTime, TIME_FORMAT)) <= 0) {
                    throw new Error(`StartTime ${startTime} must be earlier than EndTime ${endTime}.`);
                }
            },
        },
        scopes: {
            primaryKey: (id) => {
                return {
                    where: {
                        Id: id,
                    },
                };
            },
            restrictTo: (usergroup) => {
                if (_.isEmpty(usergroup)) {
                    return {};
                } else {
                    return {
                        where: {
                            UserGroup: usergroup,
                        },
                    };
                }
            },
        },
    });

    Vehicle.getPrimaryKey = () => {
        return 'Id';
    };

    Vehicle.getPrimaryKeyValues = (records) => {
        const primaryKey = Vehicle.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    Vehicle.hasPrimaryKeyValues = (records) => {
        const primaryKey = Vehicle.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    Vehicle.associate = (models) => {
        // VehicleType:Vehicle (O:M)
        Vehicle.belongsTo(models.VehicleType, {
            foreignKey: 'VehicleTypeId',
        });

        // Vehicle:DeliveryMaster (O:M)
        Vehicle.hasMany(models.DeliveryMaster, {
            foreignKey: 'VehicleId',
        });
    };

    return Vehicle;
};

/**
 * Ignore timezone and get the time from ISO date string
 *
 * @param {String|Date|moment} date  this.getDataValue(key);
 * @return {String} 24-hour time without timezone
 */
function getTimeOnly(date) {
    if (moment(date, moment.ISO_8601).isValid()) {
        const actualDate = moment(date).utcOffset(0); // prevent moment from adding timezone to date (use date as it is)
        const hour = ('0' + moment(actualDate).hour()).slice(-2); // slice-2 gives leading 0
        const minute = ('0' + moment(actualDate).minutes()).slice(-2);
        return `${hour}:${minute}`;
    } else {
        return date;
    }
}
