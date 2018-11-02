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
    const DeliveryPOD = sequelize.define('DeliveryPOD', {
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
            primaryKey: true,
        },
        Signature: {
            type: DataTypes.BLOB,
        },
        Photo: {
            type: DataTypes.BLOB,
        },
    }, {
        validate: {
            atLeastOne() {
                if (_.isNil(this.getDataValue('Signature')) && _.isNil(this.getDataValue('Photo'))) {
                    throw new Error('Require either Signature and/or Photo.');
                }
            },
        },
        scopes: {
            primaryKey: (id) => {
                return {
                    where: {
                        DeliveryDetailId: id,
                    },
                };
            },
        },
    });

    DeliveryPOD.getPrimaryKey = () => {
        return 'DeliveryDetailId';
    };

    DeliveryPOD.getPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryPOD.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    DeliveryPOD.hasPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryPOD.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    DeliveryPOD.associate = (models) => {
        // DeliveryDetail:DeliveryPOD (O:O)
        DeliveryPOD.belongsTo(models.DeliveryDetail, {
            foreignKey: 'DeliveryDetailId',
        });
    };

    return DeliveryPOD;
};
