/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const tables = [
    'Vehicle',
    'DeliveryMaster',
];

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            for (const tableName of tables) {
                const table = {
                    tableName: tableName,
                    schema: SCHEMA,
                };

                await queryInterface.addColumn(table, 'UserGroup', {
                    type: Sequelize.STRING(100),
                    transaction: t,
                });
            }
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            for (const tableName of tables) {
                const table = {
                    tableName: tableName,
                    schema: SCHEMA,
                };

                await queryInterface.removeColumn(table, 'UserGroup', {
                    transaction: t,
                });
            }
        });
    },
};
