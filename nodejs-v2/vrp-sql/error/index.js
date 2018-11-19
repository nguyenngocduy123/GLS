/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const _ = require('lodash');
const Sequelize = require('sequelize');

const errors = {
    DefaultError: (err) => {
        return _.get(err, 'message', err);
    },
    SequelizeValidationError: (err) => {
        const errorList = _.get(err, 'errors.errors', err.errors);
        return _.join(_.map(errorList, 'message'), ' ');
    },
    SequelizeConnectionError: () => {
        return 'Unable to connect to SQL database';
    },
    SequelizeBulkRecordError: (err) => {
        const errorList = _.get(err, 'errors.errors', err.errors);
        return _.join(_.map(errorList, (errorItem) => {
            return errorItem.message;
        }), '. ');
    },
    SequelizeUniqueConstraintError: (err) => {
        const errorList = _.get(err, 'errors.errors', err.errors);
        const columns = _.map(errorList, (error) => `(${_.join(_.initial(_.split(error.path, '_')), ',')})`);
        const values = _.isEmpty(columns) ? 'values' : `${_.join(columns, ', ')}`;
        return `There exists another record with the same ${values}`;
    },
    SequelizeForeignKeyConstraintError: () => {
        return 'Operation invalid as record is linked to another record in another table';
    },
    SequelizeDatabaseError: (err) => {
        const message = _.get(err, 'message');
        console.log(err);        
        
        if (_.includes(message, 'Cannot insert duplicate key')) {
            return 'Id already exists in database';
        } else if (_.includes(message, 'statement conflicted with')) {
            return 'Data value referencing another column in another table is invalid';
        } else if (_.includes(message, 'Invalid column name')) {
            return 'Column name is either invalid or missing';
        } else if (_.includes(message, 'Conversion failed when converting') || _.includes(message, 'overflowed an int column')) {
            return 'Invalid data type. Example: expected number but alphanumeric text provided';
        } else if (_.includes(message, 'deadlocked on lock resources')) {
            return 'Database transaction issue. Please try again';
        } else {
            return err;
        }
    },
};

exports.TYPE = Sequelize.Error;

exports.getText = (err) => {
    const name = _.has(errors, _.get(err, 'name')) ? err.name : 'DefaultError';
    return errors[name](err);
};
