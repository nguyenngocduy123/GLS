/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import * as moment from 'moment';
import { toUpper as _toUpper, isNil as _isNil, trim as _trim, map as _map } from 'lodash-es';

import { Note } from './note';

/**
 * All possible job status
 *
 * @enum {number}
 */
export enum JobStatus {
    Pending = 1,
    Late = 2,
    Ontime = 3,
    Unsuccessful = 4,
    ExpectToBeLate = 5,
}

/**
 * All possible job types
 *
 * @enum {string}
 */
export enum JobType {
    Pickup = 'PICKUP',
    Delivery = 'DELIVERY',
}

/**
 * Item to deliver or pickup for each job
 *
 * @interface IDeliveryItem
 */
export interface IDeliveryItem {
    Id: number;
    ItemId: string;
    ItemQty: number;
    ActualItemQty: number;
}

/**
 * Text that needs to be verified before allowing driver to complete a job.
 * Should not be exported since code should be verified via functions in `Job` class
 *
 * @interface IVerificationCode
 */
interface IVerificationCode {
    Code: string;
}

/**
 * Represents a job object that is returned from the server. Multiple
 * jobs can belong to the same order, indicated by `DeliveryMasterId`.
 *
 * @class Job
 */
export class Job {
    private _Id: number;
    private _DeliveryMasterId: string;
    private _JobType: JobType;
    private _Status: JobStatus;
    private _Address: string;
    private _Postal: string;
    private _Lat: number;
    private _Lng: number;
    private _ContactName: string;
    private _ContactPhone: string;
    private _JobSequence: number;
    private _EngineRouteSeqNum: number;
    private _StartTimeWindow: Date;
    private _EndTimeWindow: Date;
    private _ActualDeliveryTime: Date;
    private _NoteFromPlanner: Note[];
    private _NoteFromDriver: Note[];
    private _DeliveryItems: IDeliveryItem[];
    private _VerificationCode: IVerificationCode;
    private _UserGroup: string;

    constructor(init?: Partial<Job>) {
        Object.assign(this, init);
    }

    get Id(): number { return this._Id; }
    set Id(id) { this._Id = id; }

    get DeliveryMasterId(): string { return this._DeliveryMasterId; }
    set DeliveryMasterId(id) { this._DeliveryMasterId = id; }

    get JobType(): JobType { return this._JobType; }
    set JobType(jobtype) { this._JobType = jobtype; }

    get Status(): JobStatus { return this._Status; }
    set Status(status) { this._Status = status; }

    get Address(): string { return this._Address; }
    set Address(addr) { this._Address = addr; }

    get Postal(): string { return this._Postal; }
    set Postal(postal) { this._Postal = postal; }

    get Lat(): number { return this._Lat; }
    set Lat(lat) { this._Lat = lat; }

    get Lng(): number { return this._Lng; }
    set Lng(lng) { this._Lng = lng; }

    get ContactName(): string { return this._ContactName; }
    set ContactName(name) { this._ContactName = name; }

    get ContactPhone(): string { return this._ContactPhone; }
    set ContactPhone(phone) { this._ContactPhone = phone; }

    get JobSequence(): number { return this._JobSequence; }
    set JobSequence(seq) { this._JobSequence = seq; }

    get EngineRouteSeqNum(): number { return this._EngineRouteSeqNum; }
    set EngineRouteSeqNum(num) { this._EngineRouteSeqNum = num; }

    get StartTimeWindow(): Date { return this._StartTimeWindow; }
    set StartTimeWindow(date) { this._StartTimeWindow = date ? moment(date).toDate() : undefined; }

    get EndTimeWindow(): Date { return this._EndTimeWindow; }
    set EndTimeWindow(date) { this._EndTimeWindow = date ? moment(date).toDate() : undefined; }

    get ActualDeliveryTime(): Date { return this._ActualDeliveryTime; }
    set ActualDeliveryTime(date) { this._ActualDeliveryTime = date ? moment(date).toDate() : undefined; }

    get NoteFromPlanner(): Note[] { return this._NoteFromPlanner; }
    set NoteFromPlanner(notes) { this._NoteFromPlanner = this.initNotes(notes); }

    get NoteFromDriver(): Note[] { return this._NoteFromDriver; }
    set NoteFromDriver(notes) { this._NoteFromDriver = this.initNotes(notes); }

    get DeliveryItems(): IDeliveryItem[] { return this._DeliveryItems; }
    set DeliveryItems(items) { this._DeliveryItems = items; }

    get VerificationCode(): IVerificationCode { return this._VerificationCode; }
    set VerificationCode(code) { this._VerificationCode = this.initVerificationCode(code); }

    get UserGroup(): string { return this._UserGroup; }
    set UserGroup(usergroup) { this._UserGroup = usergroup; }

    /**
     * Estimates job status based on local time (i.e. not server time)
     *
     * @param {boolean} [delivered=false]  Set true if job is successful, regardless complete or incomplete items count
     * @param {string} attemptedTime  Time of attempt, regardless successful or not
     * @returns {JobStatus}
     */
    estimateStatus(delivered: boolean = false, attemptedTime: string): JobStatus {
        if (delivered === false) {
            return JobStatus.Unsuccessful;
        } else if (moment(this.EndTimeWindow).isAfter(moment(attemptedTime))) {
            return JobStatus.Ontime;
        } else {
            return JobStatus.Late;
        }
    }

    /**
     * Returns an object without private properties
     *
     * @returns {*}  JSON object
     */
    toJSON(): any {
        return {
            Id: this._Id,
            DeliveryMasterId: this._DeliveryMasterId,
            JobType: this._JobType,
            Status: this._Status,
            Address: this._Address,
            Postal: this._Postal,
            Lat: this._Lat,
            Lng: this._Lng,
            ContactName: this._ContactName,
            ContactPhone: this._ContactPhone,
            JobSequence: this._JobSequence,
            StartTimeWindow: this._StartTimeWindow,
            EndTimeWindow: this._EndTimeWindow,
            NoteFromPlanner: JSON.stringify(_map(this._NoteFromPlanner, (note) => note.toJSON())),
            NoteFromDriver: JSON.stringify(_map(this._NoteFromDriver, (note) => note.toJSON())),
            UserGroup: this._UserGroup,
        };
    }

    /**
     * Whether job is a pickup
     *
     * @returns {boolean}  True if job is a pickup
     */
    isPickup(): boolean {
        return this.JobType === JobType.Pickup;
    }

    /**
     * Whether job is a delivery
     *
     * @returns {boolean}  True if job is a delivery
     */
    isDelivery(): boolean {
        return this.JobType === JobType.Delivery;
    }

    /**
     * Whether job is not done
     *
     * @returns {boolean}  True if job is not done
     */
    isPending(): boolean {
        return this.Status === JobStatus.Pending || this.Status === JobStatus.ExpectToBeLate;
    }

    /**
     * Whether job is unsuccessful; job was attempted, but items were not delivered
     *
     * @returns {boolean}  True if job is unsuccessful
     */
    isUnsuccessful(): boolean {
        return this.Status === JobStatus.Unsuccessful;
    }

    /**
     * Whether job is done
     *
     * @returns {boolean}  True if job is done
     */
    isCompleted(): boolean {
        return !this.isPending() && !this.isUnsuccessful();
    }

    /**
     * Whether job requires verification
     *
     * @returns {boolean}  True if job needs verification before allow attempt
     */
    hasVerificationCode(): boolean {
        return !!(this._VerificationCode);
    }

    /**
     * Verifies input against verification code (case-insensitive)
     *
     * @param {string} code  Code input from driver
     * @returns {boolean}  True if code input is correct
     */
    verifyCode(code: string): boolean {
        return (_toUpper(_trim(code)) === _toUpper(_trim(this._VerificationCode.Code)));
    }

    /**
     * Maps JSON from server to `Note` objects
     * As accessors cannot be of different types, this function acts like a middleman
     * @see {@link https://github.com/Microsoft/TypeScript/issues/2521}
     *
     * @private
     * @param {any[]} [notes=[]]  Note columns from server
     * @returns {Note[]}
     */
    private initNotes(notes: any[] = []): Note[] {
        notes = _isNil(notes) ? [] : notes;
        return _map(notes, (note) => new Note(note));
    }

    /**
     * Maps response from server to `IVerificationCode` object
     * As accessors cannot be of different types, this function acts like a middleman
     * @see {@link https://github.com/Microsoft/TypeScript/issues/2521}
     *
     * @private
     * @param {(string | IVerificationCode)} code  VerificationCode column from server
     * @returns {IVerificationCode}
     */
    private initVerificationCode(code: string | IVerificationCode): IVerificationCode {
        return (code && typeof code === 'string') ? { Code: code } : code as IVerificationCode;
    }
}

/**
 * Represents an attempted job. Used to send to the server to
 * indicate job attempt, regardless success or failure
 *
 * @class AttemptedJob
 */
export class AttemptedJob {
    private notePhotos?: Blob[];
    private signature?: Blob;
    private photo?: Blob;

    jobId: number;
    delivered: boolean;
    note: Note[];
    notePhotosB64: string[];
    items: { Id: number, ActualItemQty: number }[];
    signatureB64: string;
    photoB64: string;

    // for sync api
    attemptedByDriver: string;
    attemptedByVehicle: string;
    deliveryTime: string;

    constructor(init?: Partial<AttemptedJob>) {
        Object.assign(this, init);

        // get blobs of all images
        this.signature = this.b64ToBlob(this.signatureB64);
        this.photo = this.b64ToBlob(this.photoB64);
        this.notePhotos = _map(this.notePhotosB64, (photo) => this.b64ToBlob(photo));

        // initialise notes as Note instances
        if (init.note !== undefined && init.note.length) {
            this.note = _map(init.note, (note) => new Note(note));
        }
    }

    /**
     * Returns full job details with file variables in base64.
     * TODO: To be removed once binary data can be sent to server
     *
     * @returns {*}  JSON object
     */
    withBase64(): any {
        return Object.assign({
            notePhotos: _map(this.notePhotosB64, (photo) => this.trimB64Uri(photo)),
            signature: this.trimB64Uri(this.signatureB64),
            photo: this.trimB64Uri(this.photoB64),
        }, this.getJobDetails());
    }

    /**
     * Returns full job details with file variables in buffer
     *
     * @returns {*}  JSON object
     */
    withBuffer(): any {
        return Object.assign({
            notePhotos: this.notePhotos,
            signature: this.signature,
            photo: this.photo,
        }, this.getJobDetails());
    }

    /**
     * Returns job details without file variables
     *
     * @returns {*}  JSON object
     */
    private getJobDetails(): any {
        return {
            jobId: this.jobId,
            delivered: this.delivered,
            note: _map(this.note, (note) => note.toJSON()),
            items: this.items,
            attemptedByDriver: this.attemptedByDriver,
            attemptedByVehicle: this.attemptedByVehicle,
            deliveryTime: this.deliveryTime,
        };
    }

    /**
     * Remove URI portion of the base64 string
     *
     * @private
     * @param {string} b64Data  Base64 string
     * @returns {string}  Base64 string without URI information
     * @example trimB64Uri(data:image/png;charset=utf-8;base64,/9j/4) // returns `/9j/4`
     */
    private trimB64Uri(b64Data: string): string {
        b64Data = _trim(b64Data);
        if (!b64Data) { // exit function if data is empty or missing
            return undefined;
        } else if (b64Data.indexOf(';base64,')) { // remove mimetype if any
            return b64Data.split(';base64,').pop();
        }
    }

    /**
     * Converts base64 strings to blob object
     *
     * @private
     * @param {string} b64Data  Base64 string
     * @param {string} [contentType='image/jpeg']  Blob type
     * @returns {Blob}
     * @see {@link https://stackoverflow.com/a/16245768/804702}
     */
    private b64ToBlob(b64Data: string, contentType = 'image/jpeg'): Blob {
        const sliceSize = 512;

        b64Data = this.trimB64Uri(b64Data);
        if (!b64Data) { // exit function if data is empty or missing
            return undefined;
        }

        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }
}
