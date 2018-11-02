/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { remove as _remove, isEqual as _isEqual, capitalize as _capitalize, find as _find } from 'lodash-es';
import * as moment from 'moment';

import { Globals, ItemInputMethod, StorageKey } from '../../globals';
import { AuthResponse } from './auth-response';
import { AttemptedJob, Job, JobStatus } from '../classes/job';
import { GeolocationProvider } from '../geolocation/geolocation';
import { LoadingProvider } from '../loading/loading';
import { NotificationProvider } from '../notification/notification';
import { StorageProvider } from '../storage/storage';
import { WebsocketPurpose, WebsocketEvent, WebsocketProvider } from '../websocket/websocket';
import { JobsApi } from '../driver-rest/driver-rest';
import { VehicleApi } from '../driver-rest/driver-rest';

@Injectable()
export class UserDriverProvider {
    name: string;
    vehicleId: string;
    vehiclePlateNumber: string;
    vehicleUserGroup: string;

    jobs: Job[] = [];
    currentJob: Job;

    isSyncing: boolean = false; // indicates whether the device is currently syncing to server
    DATE_FORMAT: string = 'DD/MM/YYYY';

    constructor(
        public alertCtrl: AlertController,
        public geolocation: GeolocationProvider,
        public jobsApi: JobsApi,
        public loading: LoadingProvider,
        public notify: NotificationProvider,
        public storage: StorageProvider,
        public vehicleApi: VehicleApi,
        public websocket: WebsocketProvider,
    ) { }

    /**
     * Initialise driver. This function should only be called once
     *
     * @param {AuthResponse} userDetails  User object from server
     * @returns {Promise<void>}
     */
    initDriver(userDetails: AuthResponse): void {
        console.log('[INIT] Initialising driver');

        this.setDriver(userDetails);

        this.initWebsocketEvents();
        this.geolocation.start(this.vehicleId, this.vehiclePlateNumber, this.vehicleUserGroup);
    }

    /**
     * Set user details based on settings from server
     *
     * @private
     * @param {AuthResponse} userDetails  User object from server
     */
    setDriver(userDetails: AuthResponse): Promise<void> {
        console.log('[INIT] Setting driver variables and uploading offline jobs');

        this.name = userDetails.fullname;
        this.vehicleId = userDetails.vehicleId;
        this.vehiclePlateNumber = userDetails.vehiclePlateNumber;
        this.vehicleUserGroup = userDetails.vehicleUserGroup;

        // save these parameters in case the geolocation stated failed
        // so that on the app permission page, restart the geolocation tracking
        Globals.user.vehicleId = this.vehicleId;
        Globals.user.vehiclePlateNumber = this.vehiclePlateNumber;
        Globals.user.vehicleUserGroup = this.vehicleUserGroup;

        this.configureFeatures(userDetails);

        // even though uploadOfflineJobs also calls getJobsFromServer, but there is a
        // chance where it doesn't call getJobsFromServer, so it's better to upload
        // offline jobs only after getting full job list from server
        return this.getJobsFromServer().then(this.uploadOfflineJobs).catch(() => { });
    }

    /**
     * Reset driver-specific variables
     */
    resetDriver(): void {
        this.name = undefined;
        this.vehicleId = undefined;
        this.vehiclePlateNumber = undefined;
        this.vehicleUserGroup = undefined;

        this.jobs = [];
        this.currentJob = undefined;

        this.geolocation.stop();
    }

    /**
     * Function to call at every job attempt. Process is as such:
     *  1. Attempted job is stored on the device storage.
     *  2. If save is successful, return. Otherwise, continue.
     *  3. Send request to API
     *  4. If API request fails, return error. Otherwise, continue.
     *
     * @param {AttemptedJob} attemptedJob  Job that was attempted
     * @returns {Promise<void>}
     */
    jobAttempt(attemptedJob: AttemptedJob): Promise<void> {
        // store in local database
        const timeNow = moment();
        return this.uploadOfflineJobs().catch((err) => {
            console.log('[ATTEMPT] Ignoring error from upload offline jobs before attempt', err);
        }).then(() => {
            // send request to server
            const attemptApi = this.jobsApi.attempt(attemptedJob).then((job) => this.onUpdateJob(job));

            if (Globals.features.enableOfflineSync === false) { // immediately return server response if feature is not enabled
                return attemptApi;
            } else {
                console.log(`[ATTEMPT] Saving job into database ${attemptedJob.jobId}`);
                return this.storage.insertJob({
                    jobId: attemptedJob.jobId,
                    attemptedByDriver: this.name,
                    attemptedByVehicle: this.vehiclePlateNumber,
                    delivered: attemptedJob.delivered,
                    deliveryTime: timeNow.toISOString(),
                    signatureB64: attemptedJob.signatureB64,
                    photoB64: attemptedJob.photoB64,
                    notePhotosB64: attemptedJob.notePhotosB64,
                    note: attemptedJob.note,
                    items: attemptedJob.items,
                }).then((insertedId) => {
                    // assume job is saved successfully and update job list on local device
                    const actualJob = this.jobs.find((job) => (job.Id === attemptedJob.jobId));
                    this.onUpdateJob({
                        Id: attemptedJob.jobId,
                        Status: actualJob.estimateStatus(attemptedJob.delivered, timeNow.toISOString()),
                        ActualDeliveryTime: timeNow.toDate(),
                        NoteFromDriver: attemptedJob.note,
                    });

                    // allow user to continue without waiting for request to complete
                    attemptApi
                        .then(() => this.storage.deleteJob(insertedId))
                        .catch((e) => console.log('[ATTEMPT] Failed to send request to server', e));
                }).catch(() => {
                    // since job cannot be saved, return attemptJob promise
                    return attemptApi;
                });
            }
        });
    }

    /**
     * Get list of all attempted jobs in the storage
     *
     * @returns {Promise<AttemptedJob[]>}
     */
    getOfflineJobs(): Promise<AttemptedJob[]> {
        if (Globals.features.enableOfflineSync === false) {
            return Promise.reject('Offline sync feature is not enabled.');
        }

        return this.storage.getAllJobs().then((results: AttemptedJob[]) => results.map((job) => new AttemptedJob(job)));
    }

    /**
     * Upload all attempted jobs in the storage to the server
     *
     * @returns {Promise<void>}
     */
    uploadOfflineJobs(): Promise<void> {
        if (Globals.features.enableOfflineSync === false) {
            return Promise.reject('Offline sync feature is not enabled.');
        }

        console.log('Uploading offline jobs');
        if (this.isSyncing === true) {
            return this.notify.error('Currently uploading data to server. Please try again 5 minutes later.').then(() => { });
        }

        this.isSyncing = true;
        return this.getOfflineJobs().then((jobs) => {
            this.isSyncing = false;
            if (jobs.length > 0) {
                return this.jobsApi.sync(jobs)
                    .then(() => this.getJobsFromServer())
                    .then(() => { this.storage.deleteAllJobs(); });
            } else {
                return Promise.resolve();
            }
        }).catch((err) => {
            this.isSyncing = false;
            throw err;
        });
    }

    /**
     * Find the next pending job in the job list
     */
    updateCurrentJob(): void {
        this.currentJob = this.jobs.find((job) => job.isPending());
    }

    /**
     * Change plate number of the vehicle that is assigned to the driver
     *
     * @param {string} newPlateNumber  New plate number
     * @returns {Promise<string>}  Returns error (if any)
     */
    updatePlateNumber(newPlateNumber: string): Promise<void> {
        return this.vehicleApi.update(this.vehicleId, { PlateNumber: newPlateNumber });
    }

    /**
     * Check whether another job needs to be done first.
     * Criteria:
     *  1. `job` is a delivery of a shipment
     *  2. The shipment has a pickup that is not done
     *
     * @param {Job} job
     * @returns {boolean}  True if another job that needs to be done first has not complete
     */
    isPreviousJobComplete(job: Job): boolean {
        if (job.isPickup() === true) {
            return true; // if job is pickup, it doesn't matter what the previous jobs statuses are
        } else {
            return !this.jobs.find((otherJob) => {
                return otherJob.DeliveryMasterId === job.DeliveryMasterId &&
                    otherJob.Id !== job.Id &&
                    otherJob.isPickup() &&
                    otherJob.JobSequence <= job.JobSequence &&
                    !otherJob.isCompleted();
            });
        }
    }

    /**
     * Get list of jobs from the server
     *
     * @private
     * @param {string} [loaderMsg='Updating jobs']  Custom loader message
     * @returns {Promise<void>}
     */
    private getJobsFromServer(loaderMsg: string = 'Updating jobs'): Promise<void> {
        const loader = this.loading.show(loaderMsg);
        const today = moment().toISOString();

        let showNotification = false;
        const previousJobInfo = Globals.user.previousJobsInfo;
        const [joblength = '', jobdate = ''] = previousJobInfo ? previousJobInfo.split(',') : [];

        return this.jobsApi.get({ date: today }).then((jobs) => {
            if (jobs.length !== Number(joblength) && (moment(jobdate, this.DATE_FORMAT).isSame(moment(), 'day'))) {
                // show notification only if job count is different from the last recent load and date is today
                showNotification = true;
            } else if (this.jobs.length > 0) {
                // check if need to show notification by checking the jobs in new list exists in local variable
                for (let i = 0; i < jobs.length; i++) {
                    const jobExists = _find(this.jobs, { Id: jobs[i].Id });
                    if (!jobExists) {
                        showNotification = true; // major job change
                        break;
                    }
                }
            }

            this.jobs = jobs.sort((a, b) => (a.EngineRouteSeqNum < b.EngineRouteSeqNum) ? -1 : 1);
            this.updateCurrentJob();
            loader.dismiss();

            if (showNotification) {
                const notificationText = 'Updated jobs list for today';
                this.notify.local(notificationText);
                this.notify.info(notificationText);
            }

            Globals.user.previousJobsInfo = `${jobs.length.toString()},${moment().format(this.DATE_FORMAT)}`;
            this.storage.setKeyValue(StorageKey.PreviousJobsInfo, Globals.user.previousJobsInfo);

        }).catch((err) => {
            loader.dismiss();
            const alert = this.alertCtrl
                .create({
                    title: 'Error',
                    subTitle: `Unable to get updated job list.<br>Please log out and log in again. Server Error: ${err}`,
                    buttons: ['OK'],
                });
            alert.present();
            throw err;
        });
    }

    /**
     * Override global settings according to server provided settings
     *
     * @private
     * @param {AuthResponse} serverSettings  Settings from server
     */
    private configureFeatures(serverSettings: AuthResponse): void {
        serverSettings.statusLabels.forEach((status) => {
            const dictionary = Globals.jobStatusPair[status.value];
            if (dictionary) {
                dictionary.title = _capitalize(status.label);
            }
        });

        Globals.setting.note.maxNumPhoto = serverSettings.noteOptions.photo.maxCount;
        Globals.setting.note.optionRequired = serverSettings.noteOptions.option.required;
        Globals.setting.note.options = serverSettings.noteOptions.option.list;

        Globals.setting.pod.photoRequired = serverSettings.podOptions.photo.required;

        Globals.setting.item.defaultInput = (serverSettings.itemOptions.input.default === 'BARCODE') ? ItemInputMethod.Barcode : ItemInputMethod.Keyboard;
        Globals.setting.item.allowSwitchInput = serverSettings.itemOptions.input.allowToggle;
        Globals.setting.item.acceptedCodes = serverSettings.itemOptions.barcode.formats;
    }

    /**
     * Initialise all driver-related websocket message events
     *
     * @private
     */
    private initWebsocketEvents(): void {
        this.websocket.onJSON(WebsocketEvent.Vehicle, (msg) => {
            if (msg.purpose === WebsocketPurpose.Update || msg.purpose === WebsocketPurpose.Create) {
                msg.data.forEach((vehicle) => this.onUpdateVehicle(vehicle));
            }
        });

        this.websocket.onJSON(WebsocketEvent.DeliveryPlan, (msg) => {
            if (msg.purpose === WebsocketPurpose.Update || msg.purpose === WebsocketPurpose.Create) {
                const todayPlanChanged = msg.data.indexOf(moment().format('YYYY-MM-DD'));
                if (todayPlanChanged > -1) {
                    this.getJobsFromServer();
                }
            }
        });

        this.websocket.onJSON(WebsocketEvent.DeliveryMaster, (msg) => {
            if (msg.purpose === WebsocketPurpose.Delete) {
                this.onDeleteJob(msg.data);
            }
        });

        this.websocket.onJSON(WebsocketEvent.DeliveryDetail, (msg) => {
            if (msg.purpose === WebsocketPurpose.Update || msg.purpose === WebsocketPurpose.Attempted) {
                msg.data.forEach((job) => this.onUpdateJob(job));
            }
        });

        this.websocket.onJSON(WebsocketEvent.DeliveryItem, (msg) => {
            if (msg.purpose === WebsocketPurpose.Create) {
                const jobId = Number(msg.data[0].DeliveryDetailId);
                this.onUpdateJob({
                    Id: jobId,
                    DeliveryItems: msg.data,
                });
            } else if (msg.purpose === WebsocketPurpose.Delete) {
                msg.data.forEach((deletedItems) => {
                    const jobId = Number(deletedItems.DeliveryDetailId);
                    const oldItems = this.jobs.find((job) => job.Id === jobId).DeliveryItems;
                    this.onUpdateJob({
                        Id: jobId,
                        DeliveryItems: oldItems.filter((item) => deletedItems.Ids.indexOf(item.Id) < 0), // get list of deliveryitems that is not deleted
                    });
                });
            }
        });
    }

    /**
     * Websocket event: New vehicle is assigned.
     * Note: This event will not be called for the scenario when the originally
     * assigned vehicle is later assigned to another driver
     *
     * @private
     * @param {{ Id: string, PlateNumber: string }} newVehicle  Vehicle that is newly assigned
     */
    private onUpdateVehicle(newVehicle: { Id: string, PlateNumber: string, UserGroup: string }): void {
        const oldVehicleId = this.vehicleId;
        this.vehicleId = newVehicle.Id;
        this.vehiclePlateNumber = newVehicle.PlateNumber;
        this.vehicleUserGroup = newVehicle.UserGroup;

        if (oldVehicleId !== this.vehicleId) {
            console.log(`[WEBSOCKET] Changed vehicle assignment from ${oldVehicleId} to ${this.vehicleId}`);
            this.getJobsFromServer('Updating jobs due to change of vehicle...');
        }

        // have to set these variables again
        this.geolocation.start(this.vehicleId, this.vehiclePlateNumber, this.vehicleUserGroup);
    }

    /**
     * Websocket event: Any job modifications, including DeliveryItem changes
     *
     * @private
     * @param {Job} newJob  New job details
     */
    private onUpdateJob(newJob: Partial<Job>) {
        newJob.Id = Number(newJob.Id); // ensure DeliveryDetail Id doesn't get overwritten with string
        const jobToUpdate = this.jobs.find((job) => job.Id === newJob.Id);
        Object.assign(jobToUpdate, newJob);

        // updated affected jobs (in case update job function is called when driver is offline)
        if (jobToUpdate.isUnsuccessful() === true && jobToUpdate.isPickup() === true) {
            this.jobs.forEach((job) => {
                if (jobToUpdate.DeliveryMasterId === job.DeliveryMasterId &&
                    jobToUpdate.JobSequence <= job.JobSequence &&
                    job.isDelivery() && job.isPending()) {
                    job.Status = JobStatus.Unsuccessful;
                }
            });
        }

        // don't show notifications for change verification code and update expected to be late status
        if (newJob.DeliveryMasterId) {
            // TODO: Show only one at any one time
            // this.notify.info(`Job ${newJob.DeliveryMasterId} (${newJob.JobType}) has been updated`);
        }

        // check if there is a need to update current job
        if (_isEqual(this.currentJob, jobToUpdate.Id) === false) {
            this.updateCurrentJob();
        }
    }

    /**
     * Websocket event: Delete existing job
     *
     * @private
     * @param {string[]} orderIds  List of DeliveryMasterId
     */
    private onDeleteJob(orderIds: string[]): void {
        let shouldUpdateCurrentJob = false;
        _remove(this.jobs, (job) => {
            if (orderIds.indexOf(job.DeliveryMasterId) > -1) {
                this.notify.info(`Job ${job.DeliveryMasterId} (${job.JobType}) has been removed.`);

                // check if the current job was removed
                if (!shouldUpdateCurrentJob && orderIds.indexOf(this.currentJob.DeliveryMasterId) > -1) {
                    shouldUpdateCurrentJob = true;
                }
                return true;
            }
        });

        if (shouldUpdateCurrentJob) {
            this.updateCurrentJob();
        }
    }
}
