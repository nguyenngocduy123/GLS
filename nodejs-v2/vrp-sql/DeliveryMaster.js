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
    const DeliveryMaster = sequelize.define('DeliveryMaster', {
        Id: {
            primaryKey: true,
            type: DataTypes.STRING(30),
            validate: {
                is: {
                    args: ['^[A-Za-z0-9-_ ]+$', 'i'],
                    msg: 'Id cannot contain symbols other than dashes, underscores and spaces.',
                },
                not: {
                    args: ['^(job|item)$', 'i'], // Invalid because of API path for other Entities
                    msg: 'Id cannot be `job` or `item` (without backtick).',
                },
                len: {
                    args: [1, 30],
                    msg: 'Id must be within 30 characters.',
                },
            },
        },
        VehicleId: {
            type: DataTypes.STRING(50),
            references: {
                model: {
                    tableName: 'Vehicle',
                    schema: sequelize.options.define.schema,
                },
                key: 'Id',
            },
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 50],
                    msg: 'VehicleId must be within 50 characters.',
                },
            },
        },
        LastAttemptedByDriver: {
            type: DataTypes.STRING(100),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 100],
                    msg: 'LastAttemptedByDriver must be within 100 characters.',
                },
            },
        },
        LastAttemptedByPlateNumber: {
            type: DataTypes.STRING(10),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 10],
                    msg: 'LastAttemptedByPlateNumber must be within 10 characters.',
                },
            },
        },
        Priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2,
            validate: {
                isInt: {
                    args: {
                        min: 1,
                        max: 10,
                    },
                    msg: 'Priority must be an Integer between 1 and 10 (Higher number has higher priority).',
                },
            },
        },
        CustomerName: {
            type: DataTypes.STRING(254),
            validate: {
                len: {
                    args: [1, 254],
                    msg: 'CustomerName must be within 254 characters.',
                },
            },
        },
        CustomerPhone: {
            type: DataTypes.STRING(8),
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'CustomerPhone must contain numbers only.',
                },
                len: {
                    args: '8',
                    msg: 'CustomerPhone must have a length of 8 characters.',
                },
            },
        },
        CustomerEmail: {
            type: DataTypes.STRING(254),
            validate: {
                isEmail: {
                    args: true,
                    msg: 'CustomerEmail is invalid.',
                },
                len: {
                    args: [1, 254],
                    msg: 'CustomerEmail must be within 254 characters.',
                },
            },
        },
        VehicleRestriction: {
            type: DataTypes.STRING('MAX'),
        },
        UserGroup: {
            type: DataTypes.STRING(100),
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
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

    DeliveryMaster.getPrimaryKey = () => {
        return 'Id';
    };

    DeliveryMaster.getPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryMaster.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    DeliveryMaster.hasPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryMaster.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    DeliveryMaster.associate = (models) => {
        // DeliveryMaster:DeliveryDetail (O:M)
        DeliveryMaster.hasMany(models.DeliveryDetail, {
            foreignKey: 'DeliveryMasterId',
        });

        // Vehicle:DeliveryMaster (O:M)
        DeliveryMaster.belongsTo(models.Vehicle, {
            foreignKey: 'VehicleId',
        });
    };

    DeliveryMaster.beforeBulkCreate((instances) => {
        return _.map(instances, setDefaultValues);
    });

    DeliveryMaster.beforeCreate((instance) => {
        return setDefaultValues(instance);
    });

    return DeliveryMaster;
};

function setDefaultValues(instance) {
    instance.VehicleId = null;
    instance.LastAttemptedByDriver = null;
    instance.LastAttemptedByPlateNumber = null;
    return instance;
}
