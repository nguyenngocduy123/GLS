/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { Base64 } from '@ionic-native/base64';
import { get as _get, trim as _trim } from 'lodash-es';
import { PointGroup } from 'angular2-signaturepad/signature-pad';
import { ModalController } from 'ionic-angular';

import { AttemptedJob, Job } from '../classes/job';
import { Note, DriverNoteKey } from '../classes/note';
import { DiagnosticProvider } from '../diagnostic/diagnostic';
import { GeolocationProvider } from '../geolocation/geolocation';
import { UserDriverProvider } from '../user/user-driver';

/**
 * Possible actions that a driver can do for a job
 *
 * @enum {number}
 */
enum CurrentJobAction {
    Success,
    Fail,
}

@Injectable()
export class CurrentJobProvider {
    id: number;
    action: CurrentJobAction;

    inputByBarcode: boolean = false;
    items: { id: number, name: string, expected: number, actual: number, scanned: string[] }[] = [];

    noteOption: string;
    noteText: string;
    notePhotos: string[] = []; // array of file urls

    verified: boolean = false;
    podSignature: string; // base64
    podSignatureData: PointGroup[] = []; // temp variable. required because fromDataURL does not work correctly for all devices
    podPhoto: string; // file url

    constructor(
        public base64: Base64,
        public diagnostic: DiagnosticProvider,
        public driver: UserDriverProvider,
        public geolocation: GeolocationProvider,
        public modalCtrl: ModalController,
    ) { }

    /**
     * Initialise item list based on current job's item list
     *
     * @param {boolean} [forceClear=false]  Set true to set quantity property as 0, otherwise use existing values
     */
    initItems(forceClear: boolean = false): void {
        const details = this.getDetails();

        let overwrite = false; // this handles scenario where delivery item changes after user keys in
        if (forceClear === true || this.items.length === 0) {
            this.inputByBarcode = false;
            overwrite = true;
        }

        this.items = details.DeliveryItems.map(({ Id, ItemId, ItemQty, ActualItemQty }) => {
            let qty = ActualItemQty;
            let scanned = [];
            if (overwrite === false) {
                const prevItem = this.items.find((item) => item.name === ItemId);
                scanned = prevItem ? prevItem.scanned : [];
                qty = prevItem ? prevItem.actual : ActualItemQty;
            }
            return { id: Id, name: ItemId, expected: ItemQty, actual: qty, scanned: scanned };
        });
    }

    /**
     * Initialise notes based on current job's note values
     *
     * @param {boolean} [forceClear=false]  Set true to reset to '' or server's Note value
     */
    initNotes(forceClear: boolean = false): void {
        if (forceClear === true || !(this.noteOption || this.noteText)) {
            const details = this.getDetails();

            if (details.NoteFromDriver.length > 0) {
                const prevNoteOption = details.NoteFromDriver.find((note) => note.key === DriverNoteKey.Option);
                this.noteOption = _get(prevNoteOption, 'value');

                const prevNoteText = details.NoteFromDriver.find((note) => note.key === DriverNoteKey.FreeText);
                this.noteText = _get(prevNoteText, 'value');
            }

            this.notePhotos = [];
        }
    }

    /**
     * Get latest job details from driver provider / model to ensure accuracy. Details
     * may change when the job is in the middle of attempting a job
     *
     * @returns {Job}
     */
    getDetails(): Job {
        if (this.id !== undefined) {
            return this.driver.jobs.find((job) => (job.Id === this.id));
        }
    }

    /**
     * Indicate that attempting job is successful
     *
     * @param {number} jobId  Id of job
     */
    setSuccess(jobId: number): void {
        this.id = jobId;
        this.action = (this.action) ? this.action : CurrentJobAction.Success;
    }

    /**
     * Indicate that attempting job is unsuccessful
     *
     * @param {number} jobId  Id of job
     */
    setFail(jobId: number): void {
        this.id = jobId;
        this.action = (this.action) ? this.action : CurrentJobAction.Fail;
    }

    /**
     * Whether attempting job is successful
     *
     * @returns {boolean}  True if attempting job is successful
     */
    isSuccess(): boolean {
        return (this.action === CurrentJobAction.Success);
    }

    /**
     * Sends request to the server for current attempted job
     *
     * @returns {Promise<void>}  Returns error (if any)
     */
    complete(): Promise<void> {
        const job = this.getDetails();
        if (this.isItemsValid(job) === false) {
            return Promise.reject('invalid_items');

        } else if (this.driver.isPreviousJobComplete(job) === false) {
            return Promise.reject('Please ensure the previous pickup job has been completed first.');

        } else {
            return this.diagnostic.hasLocationPermission().then((enabled) => {
                if (enabled === true) {
                    return this.constructRequest();
                } else {
                    return new Promise<AttemptedJob>((resolve, reject) => {
                        const modal = this.modalCtrl.create('AppPermissionPage', {}, { enableBackdropDismiss: false });
                        modal.onDidDismiss(() => this.constructRequest().then(resolve).catch(reject));
                        modal.present();
                    });
                }
            }).then((attemptedJob) => {
                return this.driver.jobAttempt(attemptedJob);
            }).then(() => this.reset());
        }
    }

    /**
     * Reset local variables
     */
    reset(): void {
        this.id = undefined;
        this.action = undefined;

        this.inputByBarcode = false;
        this.items = [];

        this.noteOption = undefined;
        this.noteText = undefined;
        this.notePhotos = [];

        this.verified = false;
        this.podSignature = undefined;
        this.podSignatureData = [];
        this.podPhoto = undefined;
    }

    /**
     * Get current location and convert current job data into `AttemptedJob` object
     *
     * @private
     * @returns {Promise<AttemptedJob>}
     */
    private constructRequest(): Promise<AttemptedJob> {
        console.log('[ATTEMPT] Getting location');
        return Promise.all([
            this.convertPhotosToBase64(),
            this.geolocation.getCurrentLocation().catch(() => { }),
        ]).then((results) => {
            const base64 = results[0];
            const currentPosition = results[1];
            console.log('[ATTEMPT] Current position is', currentPosition);

            const note = [];
            if (this.noteOption) {
                note.push(new Note({ key: DriverNoteKey.Option, value: this.noteOption }));
            }

            if (this.noteText) {
                note.push(new Note({ key: DriverNoteKey.FreeText, value: this.noteText }));
            }

            if (this.isSuccess() === true) {
                note.push(new Note({ key: DriverNoteKey.InputMethod, value: this.inputByBarcode ? 'Barcode' : 'Text' }));
            }

            if (currentPosition) {
                note.push(new Note({
                    key: DriverNoteKey.CurrentPosition,
                    value: {
                        lat: _get(currentPosition, 'coords.latitude'),
                        lng: _get(currentPosition, 'coords.longitude'),
                        accuracy: _get(currentPosition, 'coords.accuracy'),
                    },
                }));
            }

            return new AttemptedJob({
                jobId: this.id,
                delivered: this.isSuccess(),
                note: note,
                notePhotosB64: base64.notePhotos,
                items: this.items.map((item) => ({ Id: item.id, ActualItemQty: item.actual })),
                signatureB64: this.podSignature,
                photoB64: base64.podPhoto,
            });
        });
    }

    /**
     * Check whether the current item list is up-to-date (e.g. in case of websocket changes)
     *
     * @private
     * @param {Job} job  Job to validate
     * @returns {boolean}  True if item list is up-to-date
     */
    private isItemsValid(job: Job): boolean {
        if (this.isSuccess() === false) {
            return true; // not delivered, no need to validate
        } else if (this.items.length !== job.DeliveryItems.length) {
            return false; // guaranteed to fail validation
        } else {
            return this.items.every((item) => {
                return !!job.DeliveryItems.find((deliveryItem) => (deliveryItem.Id === item.id && deliveryItem.ItemQty === item.expected)); // if not found = invalid, return false to exit loop
            });
        }
    }

    /**
     * Convert current job variables that are stored as file path into base64 string
     *
     * @private
     * @returns {Promise<{ podPhoto: string, notePhotos: string[] }>}
     */
    private convertPhotosToBase64(): Promise<{ podPhoto: string, notePhotos: string[] }> {
        const promises = [this.podPhoto, ...this.notePhotos];

        return Promise.all(promises.map((fullpath) => this.fileToB64(fullpath))).then((base64) => {
            const [podPhoto, ...notePhotos] = base64;
            return { podPhoto, notePhotos };
        });
    }

    /**
     * Get file path on storage and convert file to base64 string
     *
     * @private
     * @param {string} fullpath  File path on storage
     * @returns {Promise<string>}  Base64 string
     */
    private fileToB64(fullpath: string): Promise<string> {
        fullpath = _trim(fullpath);
        if (!fullpath) {
            return Promise.resolve('');

        } else {
            return this.base64.encodeFile(fullpath).catch((err) => {
                if (err === 'cordova_not_available') {
                    return ''; // for testing on web
                } else {
                    throw err;
                }
            });
        }
    }
}
