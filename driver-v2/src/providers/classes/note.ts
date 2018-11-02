/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { trim as _trim } from 'lodash-es';

/**
 * Possible key values for driver's note
 *
 * @enum {string}
 */
export enum DriverNoteKey {
    Option = 'Template',
    FreeText = 'Comments',
    InputMethod = 'Input Items By',
    CurrentPosition = 'ActualDeliveryLocation',
}

/**
 * Represents each note object in Note column of each job
 *
 * @class Note
 */
export class Note {
    private _key: DriverNoteKey;
    private _value: any;

    constructor(init?: Partial<Note>) {
        Object.assign(this, init);
    }

    get key(): DriverNoteKey { return this._key; }
    set key(key) { this._key = key; }

    get value(): any { return this._value; }
    set value(val) {
        if (typeof val === 'string') {
            val = _trim(val).replace(/(\r\n|\n|\r)/gm, '. '); // removes newlines
        }
        this._value = val;
    }

    /**
     * Returns an object without private properties
     *
     * @returns {*}  JSON object
     */
    toJSON(): any {
        return { key: this._key, value: this.value };
    }

    /**
     * Returns note in string format '<%_KEY_%>:<%_VALUE_%>'
     *
     * @returns {string}
     */
    toString(): string {
        let valueText = this._value ? this._value : '-';
        if (this.isJson(this._value) === true) {
            valueText = '';
            for (const nestedKey in this._value) {
                valueText += `(${nestedKey}) ${this._value[nestedKey]}. `;
            }
        }
        return `${this._key}: ${valueText}`;
    }

    private isJson(item): boolean {
        // this function passes tests for Blob, null, Array, strings, numbers
        return item instanceof Object && item.constructor === Object;
    }
}
