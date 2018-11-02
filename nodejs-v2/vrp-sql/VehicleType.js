/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const vrpUtils = require('../vrp-common/utils');

module.exports = (sequelize, DataTypes) => {
    const VehicleType = sequelize.define('VehicleType', {
        Id: {
            primaryKey: true,
            autoIncrement: true,
            type: DataTypes.INTEGER,
        },
        Name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 50],
                    msg: 'Name must be within 50 characters.',
                },
            },
        },
        Capacity: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                isFloat: {
                    args: {
                        min: 0,
                    },
                    msg: 'Capacity must be a Number greater than or equal 0.',
                },
            },
        },
        FixedCost: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                isFloat: {
                    args: {
                        min: 0,
                    },
                    msg: 'FixedCost must be a Number greater than or equal 0.',
                },
            },
        },
        DistanceCost: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                isFloat: {
                    args: {
                        min: 0,
                    },
                    msg: 'DistanceCost must be a Number greater than or equal 0.',
                },
            },
        },
        TravelTimeCost: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                isFloat: {
                    args: {
                        min: 0,
                    },
                    msg: 'TravelTimeCost must be a Number greater than or equal 0.',
                },
            },
        },
        WaitingTimeCost: {
            type: DataTypes.FLOAT,
            defaultValue: 0,
            validate: {
                isFloat: {
                    args: {
                        min: 0,
                    },
                    msg: 'WaitingTimeCost must be a Number greater than or equal 0.',
                },
            },
        },
    }, {
        scopes: {
            primaryKey: (id) => {
                return {
                    where: {
                        Id: id,
                    },
                };
            },
        },
    });

    VehicleType.getPrimaryKey = () => {
        return 'Id';
    };

    VehicleType.getPrimaryKeyValues = (records) => {
        const primaryKey = VehicleType.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    VehicleType.hasPrimaryKeyValues = (records) => {
        const primaryKey = VehicleType.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    VehicleType.associate = (models) => {
        // VehicleType:Vehicle (O:M)
        VehicleType.hasMany(models.Vehicle, {
            foreignKey: 'VehicleTypeId',
        });
    };

    return VehicleType;
};
