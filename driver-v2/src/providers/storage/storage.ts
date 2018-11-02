/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';

import { Globals, StorageKey } from '../../globals';
import { JobsTable, IJobsColumns, KeyValueTable } from './sql-table';

@Injectable()
export class StorageProvider {
    private databaseName = 'simtech.opms.lml';

    private tableKeyVal: KeyValueTable;
    private tableJobs: JobsTable;

    constructor(
        public sqlite: SQLite,
    ) { }

    /**
     * Establishes connection to the database and creates all tables
     *
     * @returns {Promise<void>}
     */
    init(): Promise<void> {
        return this.sqlite.create({
            name: this.databaseName,
            location: 'default',

        }).then((db: SQLiteObject) => {
            this.tableKeyVal = new KeyValueTable(db);
            this.tableJobs = new JobsTable(db);
            return this.createTables();

        }).then(() => {
            if (Globals.features.showChangeUrl) {
                return this.getKeyValue(StorageKey.Url).then((url) => {
                    if (url !== undefined) {
                        Globals.url = url;
                    }
                });
            } else {
                // overwrite existing database value because driver can no longer change url
                return this.setKeyValue(StorageKey.Url, Globals.default.url).then(() => { });
            }
        }).then(() => {
            return this.getKeyValue(StorageKey.ApiToken).then((token) => {
                if (token !== undefined) {
                    Globals.user.token = token;
                }
            });
        }).then(() => {
            return this.getKeyValue(StorageKey.Username).then((username) => {
                if (username !== undefined) {
                    Globals.user.username = username;
                }
            });
        }).then(() => {
            return this.getKeyValue(StorageKey.PreviousJobsInfo).then((previousjobsinfo) => {
                if (previousjobsinfo !== undefined) {
                    Globals.user.previousJobsInfo = previousjobsinfo;
                }
            });
        }).catch(() => { }); // catch for web usage
    }

    /**
     * Insert a job into the `jobs` table
     *
     * @param {IJobsColumns} job  Job to insert
     * @returns {Promise<number>}  Row ID
     */
    insertJob(job: IJobsColumns): Promise<number> {
        if (this.tableJobs === undefined) { return Promise.reject('Tables are not initialised'); }

        return this.tableJobs.sqlInsert(job);
    }

    /**
     * Get all jobs from `jobs` table
     *
     * @returns {Promise<IJobsColumns[]>}
     */
    getAllJobs(): Promise<IJobsColumns[]> {
        if (this.tableJobs === undefined) { return Promise.reject('Tables are not initialised'); }

        return this.tableJobs.sqlSelect().then((results: IJobsColumns[]) => {
            return results.map((row) => {
                // this parsing must be done manually since javascript has no context of what is object at runtime
                row.delivered = this.toBool(row.delivered);
                row.notePhotosB64 = this.toJSON(row.notePhotosB64);
                row.note = this.toJSON(row.note);
                row.items = this.toJSON(row.items);
                return row;
            });
        });
    }

    /**
     * Delete all jobs from `jobs` table
     *
     * @returns {Promise<number>}  Number of rows affected
     */
    deleteAllJobs(): Promise<number> {
        if (this.tableJobs === undefined) { return Promise.reject('Tables are not initialised'); }

        return this.tableJobs.sqlDeleteAll();
    }

    /**
     * Delete one job based on row ID from `jobs` table
     *
     * @param {number} id  Row ID
     * @returns {Promise<number>}  Number of rows affected
     */
    deleteJob(rowId: number): Promise<number> {
        if (this.tableJobs === undefined) { return Promise.reject('Tables are not initialised'); }

        return this.tableJobs.sqlDelete(rowId);
    }

    /**
     * Set value of particular key
     *
     * @param {string} key  Unique identifier
     * @param {string} value  Value that is linked to the `key`
     * @returns {Promise<number>}  Number of rows affected
     */
    setKeyValue(key: string, value: string): Promise<number> {
        // resolve for setKeyValue if table is not initialised
        if (this.tableKeyVal === undefined) { return Promise.resolve(undefined); }

        return this.tableKeyVal.sqlSetValue(key, value);
    }

    /**
     * Get value that is mapped to a particular key
     *
     * @param {string} key  Unique identifier
     * @returns {Promise<string>}  Value that is linked to the `key`
     */
    getKeyValue(key: string): Promise<string> {
        // resolve for setKeyValue if table is not initialised
        if (this.tableKeyVal === undefined) { return Promise.resolve(undefined); }

        return this.tableKeyVal.sqlGetValue(key);
    }

    /**
     * Parse column into object.
     * If `val` is JSON object, `val` is returned as an object.
     * If `val` is not JSON object, `val` is returned as it is
     *
     * @private
     * @param {*} val  Value of any column
     * @returns {*}
     */
    private toJSON(val: any): any {
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    }
    /**
     * Parse column into boolean
     *
     * @private
     * @param {any} val  Value of any column
     * @returns {boolean}
     */
    private toBool(val: any): boolean {
        return (val === 'true' || val === true) ? true : false;
    }

    /**
     * Create tables if does not exist. If exist, check if the table is the latest version. If
     * table version is outdated, re-create the table
     *
     * @private
     * @returns {Promise<void>}
     */
    private createTables(): Promise<void> {
        // always try to create key-value table
        return this.tableKeyVal.sqlCreate().then(() => {
            // get current version number for jobs table
            return this.tableKeyVal.sqlGetValue(this.tableJobs.name);
        }).then((currVersion) => {
            console.log(`[SQL] Current jobs table database version ${currVersion}`);

            // check if the current table is outdated
            if (currVersion === undefined || Number(currVersion) < Number(this.tableJobs.version)) {
                console.log(`[SQL] Updating jobs table to version ${this.tableJobs.version}`);
                // if outdated or does not exist, create the table
                return this.tableJobs.sqlDrop().then(() => {
                    return this.tableJobs.sqlCreate();
                }).then(() => {
                    return this.tableKeyVal.sqlSetValue(this.tableJobs.name, String(this.tableJobs.version));
                });
            }
        }).then(() => { });
    }
}
