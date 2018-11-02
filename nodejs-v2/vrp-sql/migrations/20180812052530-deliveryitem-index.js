/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const { SCHEMA } = require('./config/config');
const table = {
    tableName: 'DeliveryItem',
    schema: SCHEMA,
};
const indexName = 'IX_DeliveryItem_DeliveryDetailId';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // http://10.218.68.162:8888/root/vrp-nodejs/issues/308

        // create nonclustered index for primary key
        await queryInterface.sequelize.query(`ALTER TABLE [${table.schema}].[${table.tableName}] ADD PRIMARY KEY NONCLUSTERED ([Id])`);
        // create clustered index on DeliveryDetailId instead of Id (primary key)
        await queryInterface.sequelize.query(`CREATE CLUSTERED INDEX [${indexName}] ON [${table.schema}].[${table.tableName}] ([DeliveryDetailId])`);
    },
    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeIndex(table, indexName);

        throw new Error('Primary Key index cannot be removed via migrations script.');
    },
};
