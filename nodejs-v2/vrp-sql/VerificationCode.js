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
    const VerificationCode = sequelize.define('VerificationCode', {
        DeliveryDetailId: {
            primaryKey: true,
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
        Code: {
            type: DataTypes.STRING(5),
            allowNull: false,
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'VerificationCode must contain numbers only.',
                },
                len: {
                    args: '5',
                    msg: 'VerificationCode must have a length of 5 characters.',
                },
            },
        },
    }, {
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

    VerificationCode.getPrimaryKey = () => {
        return 'DeliveryDetailId';
    };

    VerificationCode.getPrimaryKeyValues = (records) => {
        const primaryKey = VerificationCode.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    VerificationCode.hasPrimaryKeyValues = (records) => {
        const primaryKey = VerificationCode.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    VerificationCode.associate = (models) => {
        // DeliveryDetail:VerificationCode (O:O)
        VerificationCode.belongsTo(models.DeliveryDetail, {
            foreignKey: 'DeliveryDetailId',
        });
    };

    return VerificationCode;
};
