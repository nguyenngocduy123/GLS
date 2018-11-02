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
    const DeliveryItem = sequelize.define('DeliveryItem', {
        Id: { // Surrogate key
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        DeliveryDetailId: {
            type: DataTypes.INTEGER,
            references: {
                model: {
                    tableName: 'DeliveryDetail',
                    schema: sequelize.options.define.schema,
                },
                key: 'Id',
            },
            allowNull: false,
            onDelete: 'CASCADE',
        },
        ItemId: {
            type: DataTypes.STRING(30),
            references: {
                model: {
                    tableName: 'Item',
                    schema: sequelize.options.define.schema,
                },
                key: 'Id',
            },
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            allowNull: false,
            validate: {
                len: {
                    args: [1, 30],
                    msg: 'ItemId must be within 30 characters.',
                },
            },
        },
        ItemQty: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        gt: 0,
                    },
                    msg: 'ItemQty must be a Number greater than 0.',
                },
            },
        },
        ActualItemQty: {
            type: DataTypes.FLOAT,
            validate: {
                isFloat: {
                    args: {
                        gte: 0,
                    },
                    msg: 'ActualItemQty must be a Number at least 0.',
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

    DeliveryItem.getPrimaryKey = () => {
        return 'Id';
    };

    DeliveryItem.getPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryItem.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    DeliveryItem.hasPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryItem.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    DeliveryItem.associate = (models) => {
        // DeliveryDetail:DeliveryItem (O:M)
        DeliveryItem.belongsTo(models.DeliveryDetail, {
            foreignKey: 'DeliveryDetailId',
        });

        // Item:DeliveryItem (O:M)
        DeliveryItem.belongsTo(models.Item, {
            foreignKey: 'ItemId',
        });
    };

    DeliveryItem.beforeBulkCreate((instances) => {
        return _.map(instances, setDefaultValues);
    });

    DeliveryItem.beforeCreate((instance) => {
        return setDefaultValues(instance);
    });

    return DeliveryItem;
};

function setDefaultValues(instance) {
    instance.ActualItemQty = null;
    return instance;
}
