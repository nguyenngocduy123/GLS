/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'Item',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.sequelize.transaction(async (t) => {
            await queryInterface.createTable(table.tableName, {
                Id: {
                    primaryKey: true,
                    type: Sequelize.STRING(30),
                    allowNull: false,
                },
                Weight: {
                    type: Sequelize.FLOAT,
                    allowNull: false,
                },
                Description: {
                    type: Sequelize.STRING(1024),
                },
            }, {
                schema: SCHEMA,
                transaction: t,
            });

            await queryInterface.addConstraint(table, ['Weight'], {
                type: 'check',
                transaction: t,
                where: {
                    Weight: {
                        [Sequelize.Op.gt]: 0,
                    },
                },
            });
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable(table);
    },
};
