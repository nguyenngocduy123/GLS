/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const indexName = 'IX_DeliveryMaster_UserGroup_VehicleId';
const table = {
    tableName: 'DeliveryMaster',
    schema: SCHEMA,
};

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // http://10.218.68.162:8888/root/vrp-nodejs/issues/255
        await queryInterface.sequelize.query(`CREATE NONCLUSTERED INDEX [${indexName}] ON [${table.schema}].[${table.tableName}] ([UserGroup], [VehicleId])`);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(table, indexName);
    },
};
