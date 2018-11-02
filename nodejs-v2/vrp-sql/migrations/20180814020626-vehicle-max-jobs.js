/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'Vehicle',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn(table, 'MaxNumJobs', {
            type: Sequelize.INTEGER,
        });
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn(table, 'MaxNumJobs');
    },
};
