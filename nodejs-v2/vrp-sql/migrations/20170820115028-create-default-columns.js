/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const tables = [
    'Item',
    'VehicleType',
    'Vehicle',
    'DeliveryMaster',
    'DeliveryDetail',
    'DeliveryItem',
    'DeliveryNote',
    'DeliveryPOD',
    'VerificationCode',
];

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            for (const tableName of tables) {
                const table = {
                    tableName: tableName,
                    schema: SCHEMA,
                };
                await queryInterface.addColumn(table, 'IsActive', {
                    type: Sequelize.BOOLEAN,
                    defaultValue: Sequelize.literal('1'),
                    allowNull: false,
                    transaction: t,
                });

                await queryInterface.addColumn(table, 'CreatedBy', {
                    type: Sequelize.STRING(100),
                    transaction: t,
                });

                await queryInterface.addColumn(table, 'ModifiedBy', {
                    type: Sequelize.STRING(100),
                    transaction: t,
                });

                await queryInterface.addColumn(table, 'CreatedOn', {
                    type: Sequelize.DATE,
                    transaction: t,
                });

                await queryInterface.addColumn(table, 'ModifiedOn', {
                    type: Sequelize.DATE,
                    transaction: t,
                });
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        const columns = ['IsActive', 'CreatedBy', 'ModifiedBy', 'CreatedOn', 'ModifiedOn'];
        await queryInterface.sequelize.transaction(async (t) => {
            for (const tableName of tables) {
                const table = {
                    tableName: tableName,
                    schema: SCHEMA,
                };

                for (const columnName of columns) {
                    await queryInterface.removeColumn(table, columnName, {
                        transaction: t,
                    });
                }
            }
        });
    },
};
