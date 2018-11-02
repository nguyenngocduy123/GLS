/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const serviceChit = require('./serviceChit');
const transactionLog = require('./transactionLog');

module.exports = {
    /**
     * @see serviceChit.js
     */
    serviceChit,
    /**
     * @see transactionLog.js
     */
    transactionLog,
    /**
     * Get full directory path to data import template file
     * @returns {String}  Path to data import template file
     */
    importTemplate: () => `${__dirname}/import_template_v5.xlsx`,
};
