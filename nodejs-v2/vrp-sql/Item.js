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
    const Item = sequelize.define('Item', {
        Id: {
            primaryKey: true,
            type: DataTypes.STRING(30),
            allowNull: false,
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                len: {
                    args: [1, 30],
                    msg: 'Id must be within 30 characters.',
                },
            },
        },
        Weight: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        gt: 0,
                    },
                    msg: 'Weight must be a Number greater than 0.',
                },
            },
        },
        Description: {
            type: DataTypes.STRING(1024),
            validate: {
                len: {
                    args: [1, 1024],
                    msg: 'Description must be within 1024 characters.',
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

    Item.getPrimaryKey = () => {
        return 'Id';
    };

    Item.getPrimaryKeyValues = (records) => {
        const primaryKey = Item.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    Item.hasPrimaryKeyValues = (records) => {
        const primaryKey = Item.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    Item.associate = (models) => {
        // Item:DeliveryItem (O:M)
        Item.hasMany(models.DeliveryItem, {
            foreignKey: 'ItemId',
        });
    };

    return Item;
};
