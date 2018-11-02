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
    const DeliveryNote = sequelize.define('DeliveryNote', {
        Id: { // Surrogate key
            primaryKey: true,
            autoIncrement: true,
            type: DataTypes.INTEGER,
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
        },
        Photo: {
            type: DataTypes.BLOB,
            allowNull: false,
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

    DeliveryNote.getPrimaryKey = () => {
        return 'Id';
    };

    DeliveryNote.getPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryNote.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    DeliveryNote.hasPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryNote.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    DeliveryNote.associate = (models) => {
        // DeliveryDetail:DeliveryNote (O:M)
        DeliveryNote.belongsTo(models.DeliveryDetail, {
            foreignKey: 'DeliveryDetailId',
        });
    };

    return DeliveryNote;
};
