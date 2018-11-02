/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Sql');

const _ = require('lodash');
const Sequelize = require('sequelize');
const path = require('path');
const vrpUtils = require('../vrp-common/utils');
const vrpConfig = require('../configuration');

const basename = path.basename(__filename);

const db = {};
module.exports = db;

const sequelizeSettings = _.omit(vrpConfig.get('database.sql'), 'custom');

// establish connection to mssql database
const sequelize = new Sequelize(Object.assign({}, sequelizeSettings, {
    benchmark: true,
    logging: (msg) => {
        if (_.includes(msg, 'INSERT INTO [Logistics].[DeliveryPOD]') || _.includes(msg, 'INSERT INTO [Logistics].[DeliveryNote]')) {
            // truncate query (too long text)
            log.info(`${msg.substring(0, 200)}`);
        } else {
            log.info(`${msg}`);
        }
    },
    operatorsAliases: false,
    define: { // Options for all tables
        schema: vrpConfig.get('database.sql.custom.schema'),
        timestamps: true,
        createdAt: 'CreatedOn',
        updatedAt: 'ModifiedOn',
        freezeTableName: true,
    },
    hooks: {
        // bulkCreate by default does not validate fields
        beforeBulkCreate: (instances, options) => {
            options.validate = true;
        },
    },
}));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

(async () => {
    // define audit columns for all models / tables
    sequelize.beforeDefine((attributes) => {
        attributes.IsActive = {
            type: Sequelize.BOOLEAN,
            defaultValue: 1,
            allowNull: false,
            get(key) {
                // exclude these columns when returning result https://github.com/FullstackAcademy/boilermaker/pull/72
                return () => this.getDataValue(key);
            },
        };
        attributes.CreatedBy = {
            type: Sequelize.STRING(100),
            get(key) {
                // exclude these columns when returning result https://github.com/FullstackAcademy/boilermaker/pull/72
                return () => this.getDataValue(key);
            },
        };
        attributes.ModifiedBy = {
            type: Sequelize.STRING(100),
            get(key) {
                // exclude these columns when returning result https://github.com/FullstackAcademy/boilermaker/pull/72
                return () => this.getDataValue(key);
            },
        };
    });

    // intercept sequelize `set()` to set column as null if the provided value is empty string ''
    const originalSetFn = Sequelize.Model.prototype.set;
    Sequelize.Model.prototype.set = function attributeSetter() {
        if (_.isString(arguments[1]) && _.isEmpty(_.trim(arguments[1]))) {
            arguments[1] = null;
        }
        return originalSetFn.apply(this, arguments);
    };

    // import all models file
    const files = await vrpUtils.readFolder(__dirname);

    files
        .filter((file) => {
            return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
        })
        .forEach((file) => {
            const model = sequelize['import'](path.join(__dirname, file));
            db[model.name] = model;
        });

    Object.keys(db).forEach((modelName) => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });

    // set audit fields based on logged in user's credentials
    db.setCreatedBy = (req, records) => {
        _appendCol('CreatedBy', records, req);
        _appendCol('ModifiedBy', records, req);

        // prevent API from overwriting
        _unsetColumn('CreatedOn', records);
        _unsetColumn('ModifiedOn', records);
        return records;
    };
    db.setModifiedBy = (req, records) => {
        _appendCol('ModifiedBy', records, req);

        // prevent API from overwriting
        _unsetColumn('CreatedBy', records);
        _unsetColumn('CreatedOn', records);
        _unsetColumn('ModifiedOn', records);
        return records;
    };

    function _appendCol(column, records, req) {
        const name = _.get(req.user, 'fullname') || _.get(req.user, 'username');
        _setProperties(records, { [column]: name });
    }

    function _unsetColumn(column, records) {
        _setProperties(records, { [column]: undefined });
    }

    function _setProperties(records, properties) {
        if (_.isArray(records)) {
            return _.map(records, (record) => Object.assign(record, properties));
        } else {
            return Object.assign(records, properties);
        }
    }
})();
