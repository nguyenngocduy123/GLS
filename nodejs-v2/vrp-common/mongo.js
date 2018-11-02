/*
 * Copyright (C) 2018 Singapore Institute of Manufacturing Technology - All Rights Reserved
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */
'use strict';

const log = require('log4js').getLogger('Mongo');

const _ = require('lodash');
const { MongoClient, ObjectId } = require('mongodb');
const mongoConfig = require('../configuration').get('database.mongo.url');

/**
 * Connect to mongodb asynchronously
 * @async
 * @returns {Promise<object>}  MongoClient
 */
exports.connect = () => MongoClient.connect(mongoConfig, { useNewUrlParser: true });

/**
 * Convert any text to a case-insensitive regex to enable case-insensitive mongo search
 * @param {String} val  Value to convert
 * @returns {String}  Case-insensitive regex
 */
exports.toCaseInsensitiveRegex = (val) => new RegExp(`^${val}$`, 'i');

/**
 * Get _id based on string. Used for _id search
 * @param {String} id  Potential _id value
 * @returns {ObjectId|String}  Returns a value compatible for _id search
 */
exports.getObjectId = (id) => {
    // check if problem contains p_ because it's a custom _id that is stored as string
    if (ObjectId.isValid(id) && !_.startsWith(id, 'p_')) {
        return new ObjectId(id);
    } else {
        return id;
    }
};

/**
 * Generate mongodb filter for mongodb queries for _id field
 * @param {String} _id  _id value
 * @returns {Object}  Filter for mongodb queries
 */
exports.getFindIdFilter = (_id) => {
    const id = this.getObjectId(_id);
    if (id instanceof ObjectId) {
        return {
            $or: [
                { _id },
                { _id: id },
            ],
        };
    } else {
        return { _id };
    }
};

/**
 * Get a mongodb collection. Creates new collection if it does not exist.
 * @async
 * @param {Object} db  Instance of MongoClient#Db
 * @param {String} collectionName  Name of mongodb collection
 * @returns {Object}  Instance of MongoClient#Collection
 */
exports.getCollection = async (db, collectionName) => {
    try {
        const colExists = await _collectionExists(db, collectionName);

        if (colExists) {
            return db.collection(collectionName);
        } else {
            // collection does not exist, create new collection
            const collection = await db.createCollection(collectionName);

            // add indexing
            if (collectionName === 'user') {
                collection.createIndex({ username: 1 }, { unique: true }); // indexing username
            } else if (collectionName === 'usergroup') {
                collection.createIndex({ usergroup: 1 }, { unique: true }); // indexing usergroup
            } else if (collectionName === 'vehiclelastseen') {
                collection.createIndex({ VehicleId: 1 }, { unique: true }); // indexing vehiclelastseen
            } else if (collectionName === 'vehiclelogs') {
                collection.createIndex({ VehicleId: 1 }); // indexing vehicleLogs
            } else if (collectionName === 'location') {
                collection.createIndex({ postal: 1 }, { unique: true }); // indexing postal
            }

            log.info(`<MongoDB> Created collection ${collectionName}`);
        }
    } catch (err) {
        log.fatal(`<MongoDB> Unable to find/create collection ${collectionName}`, err);
        throw err;
    }
};

/**
 * Checks whether a collection already exists in database
 * @async
 * @param {Object} db  Instance of MongoClient#Db
 * @param {String} collectionName  Name of mongodb collection
 * @returns {Boolean}  `true` if collection already exists
 */
async function _collectionExists(db, collectionName) {
    try {
        const collections = await db.listCollections({ name: collectionName }).toArray();
        return (collections.length > 0);
    } catch (err) {
        return false;
    }
}
