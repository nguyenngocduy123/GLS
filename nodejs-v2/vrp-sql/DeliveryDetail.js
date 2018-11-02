/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const moment = require('moment');
const vrpUtils = require('../vrp-common/utils');

module.exports = (sequelize, DataTypes) => {
    const DeliveryDetail = sequelize.define('DeliveryDetail', {
        Id: { // Surrogate key
            primaryKey: true,
            autoIncrement: true,
            type: DataTypes.INTEGER,
        },
        DeliveryMasterId: {
            type: DataTypes.STRING(30),
            references: {
                model: {
                    tableName: 'DeliveryMaster',
                    schema: sequelize.options.define.schema,
                },
                key: 'Id',
            },
            allowNull: false,
            validate: {
                len: {
                    args: [1, 30],
                    msg: 'DeliveryMasterId must be within 30 characters.',
                },
            },
        },
        Status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                isInt: {
                    args: {
                        min: 1,
                        max: 5,
                    },
                    msg: 'Status must be an Integer between 1 and 5.',
                },
            },
        },
        JobSequence: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        JobType: {
            type: DataTypes.ENUM,
            values: ['PICKUP', 'DELIVERY'],
            allowNull: false,
            set(val, key) {
                this.setDataValue(key, val ? _.toUpper(val) : val);
            },
            validate: {
                isIn: {
                    args: [
                        ['PICKUP', 'DELIVERY'],
                    ],
                    msg: 'JobType can only be either PICKUP or DELIVERY.',
                },
            },
        },
        Address: {
            type: DataTypes.STRING(1024),
            allowNull: false,
            validate: {
                len: {
                    args: [1, 1024],
                    msg: 'Address must be within 1024 characters.',
                },
            },
        },
        Postal: {
            type: DataTypes.STRING(6),
            allowNull: false,
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'Postal code must contain numbers only.',
                },
                len: {
                    args: '6',
                    msg: 'Postal code must have a length of 6 characters.',
                },
            },
        },
        Lat: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        min: -90,
                        max: 90,
                    },
                    msg: 'Lat must be a Number between -90 and 90.',
                },
            },
        },
        Lng: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                isFloat: {
                    args: {
                        min: -180,
                        max: 180,
                    },
                    msg: 'Lng must be a Number between -180 and 180.',
                },
            },
        },
        StartTimeWindow: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        EndTimeWindow: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        ServiceTime: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: 15,
            validate: {
                isFloat: {
                    args: {
                        gt: 0,
                    },
                    msg: 'ServiceTime must have a value greater than 0.',
                },
            },
        },
        NoteFromPlanner: {
            type: DataTypes.STRING('MAX'),
            get(key) {
                return convertToJson(this.getDataValue(key));
            },
            set(val, key) {
                this.setDataValue(key, _.isObject(val) ? JSON.stringify(val) : val);
            },
        },
        NoteFromDriver: {
            type: DataTypes.STRING('MAX'),
            get(key) {
                return convertToJson(this.getDataValue(key));
            },
            set(val, key) {
                this.setDataValue(key, _.isObject(val) ? JSON.stringify(val) : val);
            },
        },
        ContactName: {
            type: DataTypes.STRING(254),
            validate: {
                len: {
                    args: [1, 254],
                    msg: 'ContactName must be within 1024 characters.',
                },
            },
        },
        ContactPhone: {
            type: DataTypes.STRING(8),
            validate: {
                isNumeric: {
                    args: true,
                    msg: 'ContactPhone must contain numbers only.',
                },
                len: {
                    args: '8',
                    msg: 'ContactPhone must have a length of 8 characters.',
                },
            },
        },
        ContactEmail: {
            type: DataTypes.STRING(254),
            validate: {
                isEmail: {
                    args: true,
                    msg: 'ContactEmail is invalid.',
                },
                len: {
                    args: [1, 254],
                    msg: 'ContactEmail must be within 1024 characters.',
                },
            },
        },
        ActualDeliveryTime: {
            type: DataTypes.DATE,
            defaultValue: null,
        },
        EngineRouteSeqNum: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: {
                    args: {
                        gt: 0,
                    },
                    msg: 'EngineRouteSeqNum must be an Integer greater than 0.',
                },
            },
        },
    }, {
        validate: {
            actualDeliveryTime() {
                if (_.toNumber(this.getDataValue('Status')) === 1 && !_.isNil(this.getDataValue('ActualDeliveryTime'))) {
                    throw new Error('Status must not be PENDING if there is ActualDeliveryTime.');
                }
            },
            timewindow() {
                const start = this.getDataValue('StartTimeWindow');
                const end = this.getDataValue('EndTimeWindow');
                if (!_.isNil(start) && !_.isNil(end)) {
                    if (moment(end).diff(moment(start)) <= 0) {
                        throw new Error(`StartTimeWindow ${start} must be earlier than EndTimeWindow ${end}.`);
                    } else if (!moment(start).isSame(moment(end), 'day')) {
                        throw new Error(`StartTimeWindow ${start} must be on same day as EndTimeWindow ${end}.`);
                    }
                }
            },
            noteFromPlanner() {
                const columnName = 'NoteFromPlanner';
                this.setDataValue(columnName, validateNotes(columnName, this.getDataValue(columnName)));
            },
            noteFromDriver() {
                const columnName = 'NoteFromDriver';
                this.setDataValue(columnName, validateNotes(columnName, this.getDataValue(columnName)));
            },
        },
        scopes: {
            primaryKey: (id) => {
                return {
                    where: {
                        Id: id,
                    },
                };
            },
            date: (startDate, endDate) => {
                const dateRange = getDateRange(startDate, endDate);
                return {
                    where: {
                        [sequelize.Op.or]: [{
                            StartTimeWindow: {
                                [sequelize.Op.between]: dateRange,
                            },
                        }, {
                            EndTimeWindow: {
                                [sequelize.Op.between]: dateRange,
                            },
                        }],
                    },
                };
            },
        },
    });

    DeliveryDetail.getPrimaryKey = () => {
        return 'Id';
    };

    DeliveryDetail.getPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryDetail.getPrimaryKey();
        return _.map(vrpUtils.toArray(records), (record) => record[primaryKey]);
    };

    DeliveryDetail.hasPrimaryKeyValues = (records) => {
        const primaryKey = DeliveryDetail.getPrimaryKey();
        const recordContainsKey = _.find(vrpUtils.toArray(records), (record) => record[primaryKey]);
        return !_.isNil(recordContainsKey);
    };

    DeliveryDetail.associate = (models) => {
        // DeliveryMaster:DeliveryDetail (O:M)
        DeliveryDetail.belongsTo(models.DeliveryMaster, {
            foreignKey: 'DeliveryMasterId',
        });

        // DeliveryDetail:DeliveryPOD (O:O)
        DeliveryDetail.hasOne(models.DeliveryPOD, {
            foreignKey: 'DeliveryDetailId',
        });

        // DeliveryDetail:DeliveryNote (O:M)
        DeliveryDetail.hasMany(models.DeliveryNote, {
            foreignKey: 'DeliveryDetailId',
        });

        // DeliveryDetail:VerificationCode (O:O)
        DeliveryDetail.hasOne(models.VerificationCode, {
            foreignKey: 'DeliveryDetailId',
        });

        // DeliveryDetail:DeliveryItem (O:M)
        DeliveryDetail.hasMany(models.DeliveryItem, {
            foreignKey: 'DeliveryDetailId',
        });
    };

    DeliveryDetail.beforeBulkCreate((instances) => {
        return _.map(instances, setDefaultValues);
    });

    DeliveryDetail.beforeCreate((instance) => {
        return setDefaultValues(instance);
    });

    return DeliveryDetail;
};

// //////////

/**
 * Get an Array that specifies the start date (at 00:00:00.000 hour) and end date (at 23:59:59.999)
 * @param {String|Date|moment} startDate  Range of dates starting from this.
 * @param {String|Date|moment} endDate  Range of dates ending with this. If no endDate is specified, endDate is on the same day as startDate.
 * @return {Array}  todo
 */
function getDateRange(startDate, endDate) {
    endDate = endDate || startDate;
    return [moment(startDate).format('YYYY-MM-DDT00:00:00Z'), moment(endDate).format('YYYY-MM-DDT23:59:59Z')];
}

/**
 * Converts String to JSON
 * @param {Object} val  todo
 * @returns {void}
 */
function convertToJson(val) {
    try {
        return JSON.parse(val);
    } catch (e) {
        return val;
    }
}

/**
 * Validate NoteFromPlanner and NoteFromDriver columns
 * @param {Object} columnName  todo
 * @param {Object} note  todo
 * @returns {void}
 */
function validateNotes(columnName, note) {
    // Accept null
    if (_.isNil(note)) {
        return null;
    }

    // Check that note is in correct format (JSON parseable)
    if (_.isString(note)) {
        try {
            note = JSON.parse(note);
        } catch (e) {
            throw new Error(`${columnName} column should be a valid JSON.`);
        }
    }

    if (_.isPlainObject(note) || _.isArray(note)) {
        note = vrpUtils.toArray(note);
    } else {
        throw new Error(`${columnName} should be an array.`);
    }

    // Check that note object consists of key and value
    _.each(note, (individualNote, i) => {
        if (!_.has(individualNote, 'key') || !_.has(individualNote, 'value')) {
            throw new Error(`${JSON.stringify(individualNote)} does not have 'key' and 'value'.`);
        } else {
            note[i] = _.pick(individualNote, ['key', 'value']);
        }
    });

    return _.isEmpty(note) ? null : JSON.stringify(note);
}

function setDefaultValues(instance) {
    instance.Status = 1;
    instance.ActualDeliveryTime = null;
    instance.EngineRouteSeqNum = null;
    instance.NoteFromDriver = null;
    return instance;
}
