/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryNote',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable(table.tableName, {
            Id: {
                autoIncrement: true,
                type: Sequelize.INTEGER,
                // primaryKey: true cannot be set here because the primary key is added in deliverynote-index script instead
                allowNull: false, // aka primary key
            },
            DeliveryDetailId: {
                type: Sequelize.INTEGER,
                references: {
                    model: {
                        tableName: 'DeliveryDetail',
                        schema: SCHEMA,
                    },
                    key: 'Id',
                },
                allowNull: false,
                onDelete: 'CASCADE',
            },
            Photo: {
                type: Sequelize.BLOB,
                allowNull: false,
            },
        }, {
            schema: SCHEMA,
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
