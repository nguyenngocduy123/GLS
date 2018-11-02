/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const sql = require('../../../configuration').get('database.sql');

console.log('======================================================================================\n');
console.log('Command to change settings file: `npm run db:migrate -- -- --settings=setting-local.js`\n');
console.log(`\tDatabase: ${sql.database}`);
console.log(`\tSchema: ${sql.custom.schema}`);
console.log('\n======================================================================================\n');

module.exports = Object.assign({}, sql, {
    SCHEMA: sql.custom.schema, // use caps to prevent sequelize from creating SequelizeMeta with schema. used by other files
});
