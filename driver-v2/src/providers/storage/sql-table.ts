/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { SQLiteObject } from '@ionic-native/sqlite';

/**
 * Result set from executed SQL statements
 *
 * @interface ISQLResultSet
 * @see {@link https://www.w3.org/TR/webdatabase/#database-query-results}
 */
interface ISQLResultSet {
    readonly insertId: number;
    readonly rowsAffected: number;
    readonly rows: { item: Function, length: number };
}

/**
 * Parent class of all tables. Defines the structure of each table
 *
 * @class Table
 */
class Table {
    constructor(
        public name: string,
        public version: number,  // increment value whenever columns list is modified
        protected db: SQLiteObject,
        protected columns: Column[],
    ) { }

    /**
     * Execute SQL statement to create table
     *
     * @returns {Promise<boolean>}  True if executed successfully
     */
    sqlCreate(): Promise<boolean> {
        const sql = `CREATE TABLE IF NOT EXISTS ${this.name} (${this.getSchema()})`;
        const params = [];
        return this.db.executeSql(sql, params).then(() => true);
    }

    /**
     * Execute SQL statement to delete table
     *
     * @returns {Promise<boolean>}  True if executed successfully
     */
    sqlDrop(): Promise<boolean> {
        const sql = `DROP TABLE IF EXISTS ${this.name}`;
        const params = [];
        return this.db.executeSql(sql, params).then(() => true);
    }

    /**
     * Gets the first row of data from dataset
     *
     * @protected
     * @param {ISQLResultSet} resultSet  SQL result set from executed SQL statement
     * @returns {*}  First row of data
     */
    protected getFirstRow(resultSet: ISQLResultSet): any {
        return (resultSet.rows.length > 0) ? resultSet.rows.item(0) : undefined;
    }

    /**
     * Gets all rows of data from dataset. Data returned is immutable
     *
     * @protected
     * @param {ISQLResultSet} resultSet  SQL result set from executed SQL statement
     * @returns {*}  All rows of data
     */
    protected getAllRows(resultSet: ISQLResultSet): any[] {
        const results = [];
        for (let i = 0; i < resultSet.rows.length; i++) {
            results.push(resultSet.rows.item(i));
        }
        return results;
    }

    /**
     * Get the row ID of the last inserted row. If result set is for multiple executed statements,
     * only the row ID of the last row will be returned
     *
     * @protected
     * @param {ISQLResultSet} resultSet  SQL result set from executed SQL statement
     * @returns {number}  Row ID
     */
    protected getInsertedId(resultSet: ISQLResultSet): number {
        if (resultSet.rowsAffected > 0) {
            return resultSet.insertId;
        } else {
            throw new Error('Unable to store record in database');
        }
    }

    /**
     * Get the number of rows that were changed by the SQL statement
     *
     * @protected
     * @param {ISQLResultSet} resultSet  SQL result set from executed SQL statement
     * @returns {number}  Number of rows affected
     */
    protected getRowsAffected(resultSet: ISQLResultSet): number {
        return resultSet.rowsAffected;
    }

    /**
     * Get schema of table in SQL query format
     *
     * @private
     * @returns {string}
     */
    private getSchema(): string {
        return this.columns.map((col) => col.getSchema()).join(',');
    }
}

/**
 * Represents one column of a table
 *
 * @class Column
 */
class Column {
    isJSON?: boolean = false;
    isBase64?: boolean = false;
    isPrimaryKey?: boolean = false;

    constructor(
        public name: string,
        public type: 'TEXT' | 'INTEGER' | 'BOOLEAN', // https://github.com/litehelpers/Cordova-sqlite-storage#general-sqlite-pitfalls
        opts?: Partial<Column>,
    ) {
        Object.assign(this, opts);
    }

    /**
     * Get schema of the column in SQL query format
     *
     * @returns {string}
     */
    getSchema(): string {
        const specialKey = (this.isPrimaryKey) ? 'PRIMARY KEY' : '';
        return `${this.name} ${this.type} ${specialKey}`;
    }
}

/**
 * List of columns in the `jobs` table
 *
 * @interface IJobsColumns
 */
export interface IJobsColumns {
    jobId: number;
    attemptedByDriver: string;
    attemptedByVehicle: string;
    delivered: boolean;
    deliveryTime: string;
    signatureB64: string;
    photoB64: string;
    notePhotosB64: string[];
    note: { key: string; value: string }[];
    items: { Id: number; ActualItemQty: number }[];
}

/**
 * Stores completed jobs that were not sent to server successfully
 *
 * @class JobsTable
 * @extends {Table}
 */
export class JobsTable extends Table {
    constructor(
        db: SQLiteObject,
    ) {
        super('jobs', 1, db,
            [
                new Column('jobId', 'INTEGER'),
                new Column('attemptedByDriver', 'TEXT'),
                new Column('attemptedByVehicle', 'TEXT'),
                new Column('delivered', 'BOOLEAN'),
                new Column('deliveryTime', 'TEXT'),
                new Column('signatureB64', 'TEXT', { isBase64: true }),
                new Column('photoB64', 'TEXT', { isBase64: true }),
                new Column('notePhotosB64', 'TEXT', { isJSON: true, isBase64: true }),
                new Column('note', 'TEXT', { isJSON: true }),
                new Column('items', 'TEXT', { isJSON: true }),
            ],
        );
    }

    /**
     * Get all rows from `jobs` table
     *
     * @returns {Promise<IJobsColumns[]>}
     */
    sqlSelect(): Promise<IJobsColumns[]> {
        const sql = `SELECT * FROM ${this.name}`;
        const params = [];
        return this.db.executeSql(sql, params).then(this.getAllRows);
    }

    /**
     * Execute SQL statement to insert one job into the `jobs` table
     *
     * @param {IJobsColumns} job  Job to be inserted
     * @returns {Promise<number>}  Row ID
     */
    sqlInsert(job: IJobsColumns): Promise<number> {
        const columns = [];
        const params = [];

        for (const key in job) {
            columns.push(key);
            params.push((job[key] instanceof Object) ? JSON.stringify(job[key]) : job[key]); // convert json objects to strings
        }

        const sql = `INSERT INTO ${this.name} (${columns.join(',')}) VALUES (${params.map(() => '?')})`;
        return this.db.executeSql(sql, params).then(this.getInsertedId);
    }

    /**
     * Execute SQL statement to delete one job based on row ID from the `jobs` table
     *
     * @param {number} id  Row ID
     * @returns {Promise<number>}  Number of rows affected
     */
    sqlDelete(id: number): Promise<number> {
        const sql = `DELETE FROM ${this.name} WHERE rowId = ?`;
        const params = [id];
        return this.db.executeSql(sql, params).then((resultSet) => resultSet.rowsAffected);
    }

    /**
     * Execute SQL statement to delete all rows from `jobs` table
     *
     * @returns {Promise<number>}  Number of rows affected
     */
    sqlDeleteAll(): Promise<number> {
        const sql = `DELETE FROM ${this.name}`;
        const params = [];
        return this.db.executeSql(sql, params).then((resultSet) => resultSet.rowsAffected);
    }
}

/**
 * Stores key value pairs. SQL storage is used instead of other means is to prevent
 * data from purging when memory size has reached its limits
 *
 * @class KeyValueTable
 * @extends {Table}
 */
export class KeyValueTable extends Table {
    constructor(
        db: SQLiteObject,
    ) {
        super('keyvalue', 1, db,
            [
                new Column('key', 'TEXT', { isPrimaryKey: true }),
                new Column('value', 'TEXT'),
            ],
        );
    }

    /**
     * Execute SQL statement to get value that is mapped to a particular key
     *
     * @param {string} key  Unique identifier
     * @returns {Promise<string>}  Value that is linked to the `key`
     */
    sqlGetValue(key: string): Promise<string> {
        const sql = `SELECT value FROM ${this.name} WHERE key = ?`;
        const params = [key];
        return this.db.executeSql(sql, params).then(this.getFirstRow).then((row: { value: string }) => row ? row.value : undefined);
    }

    /**
     * Execute SQL statement to set value of a particular key.
     * If key exist, existing value is overwritten.
     * If key does not exist, key-value pair will be inserted
     *
     * @param {string} key  Unique identifier
     * @param {string} value  Value that is linked to the `key`
     * @returns {Promise<number>}  Number of rows affected
     */
    sqlSetValue(key: string, value: string): Promise<number> {
        const sql = `INSERT OR REPLACE INTO ${this.name} VALUES (?, ?)`;
        const params = [key, value];
        return this.db.executeSql(sql, params).then(this.getRowsAffected);
    }
}
