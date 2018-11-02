/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { get as _get } from 'lodash-es';

import { Globals } from '../../globals';

/**
 * Response when requesting for location. Unused properties are omitted
 *
 * @interface ILocation
 * @see {@link https://github.com/transistorsoft/cordova-background-geolocation/wiki/Location-Data-Schema}
 */
interface ILocation {
    coords: { latitude: Number, longitude: Number, accuracy: Number };
}

@Injectable()
export class GeolocationProvider {
    private bgGeo;

    /**
     * API HTTP Method for background sync
     *
     * @type {string}
     */
    private readonly apiMethod: string = 'POST';

    /**
     * API root property name of request body
     *
     * @type {string}
     */
    private readonly apiRootProperty: string = 'record';

    /**
     * API request body format for background sync
     *
     * @type {string}
     */
    private readonly apiFormat: string = `{
        "Lat": "<%= latitude %>",
        "Lng": "<%= longitude %>",
        "Accuracy": "<%= accuracy %>",
        "RecordedTime": "<%= timestamp %>"
    }`;

    /**
     * Common / universal options for geolocation tracking
     *
     * @type {*}
     */
    private readonly geolocationOptions: any = {
        // Geolocation config
        desiredAccuracy: 0,
        distanceFilter: 10,
        stationaryRadius: 25,
        // set to true to receive debug push notification message when app is terminated or at background mode
        debug: false,
        // turn off 0 (OFF), set to 5 (VERBOSE) to record log, it is used with maxDaysToPersist
        logLevel: 0,
        // set to true to always apply the supplied config
        reset: true,
        // set to false, device will sleep for 300 seconds if device is in 'still' state, then device will wake up to get location to upload to server.
        // set to true, when device is in 'still' state, not update any location. if device exit 'still' state, it will wait for 15 mins to update location.
        pausesLocationUpdatesAutomatically: false, // prevent plugin automatically turning off location services when device is assumed to be stopped
        // Activity Recognition config
        activityRecognitionInterval: 10000,
        stopTimeout: 5,
        // Application config
        stopOnTerminate: false, // set to false, device will still tracking location when user force terminate app by swipe off in iOS platform.
        startOnBoot: true, // set to true, device will tracking location if user force re-start device.
        // iOS
        heartbeatInterval: 60,
        preventSuspend: true,
        locationAuthorizationRequest: 'Always',
        // Android
        foregroundService: true,
        notificationChannelName: 'Location Tracker',
        fastestLocationUpdateInterval: 5000,
        allowIdenticalLocations: true,
        // HTTP / SQLite config
        autoSync: Globals.features.enableGeoTracking, // disable auto sync if feature is not enabled
        httpTimeout: 20000,
        method: this.apiMethod,
        httpRootProperty: this.apiRootProperty,
        locationTemplate: this.apiFormat,
        batchSync: true, // send records in bulk
        maxBatchSize: 5000, // limit max number of records to send to server
        maxDaysToPersist: 2,
        // format is '{DAY(s)} {START_TIME}-{END_TIME}', 1 is Sunday, 7 is Sat
        schedule: [
            '1-7 7:00-23:00',  // Mon-Sun: 7:00am to 11:00pm
        ],
    };

    constructor(
        public platform: Platform,
    ) {
        this.platform.ready().then(() => {
            const bgGeo = (<any> window).BackgroundGeolocation;

            if (bgGeo !== undefined) { // for web usage
                this.bgGeo = bgGeo;

                // to be removed //
                this.bgGeo.on('location', (msg) => console.log('[LOCATION] onLocation', msg), (e) => console.log('[LOCATION] onLocation', e));
                this.bgGeo.on('http', (msg) => console.log('[LOCATION] onHttp', msg), (e) => console.log('[LOCATION] onHttpErr', e));
                // end //
            }
        });
    }

    /**
     * Start background geolocation tracking. Calling this function multiple times will not
     * affect operations. However, the variables will change accordingly.
     *
     * @param {string} vehicleId  Id of the vehicle that is assigned to driver
     * @param {string} vehiclePlateNumber  Plate number of the vehicle that is assigned to driver
     */
    start(vehicleId: string, vehiclePlateNumber: string, vehicleUserGroup: string): void {
        if (this.bgGeo !== undefined && Globals.features.enableGeoTracking === true) { // for web usage, track only if feature is enabled
            const config = Object.assign({}, this.geolocationOptions, {
                url: `${Globals.url}/rest/data/v2.1/vehicleLog`,
                headers: {
                    [Globals.default.apiHeader]: Globals.user.token,
                },
                extras: {
                    VehicleId: vehicleId,
                    PlateNumber: vehiclePlateNumber,
                    VehicleUserGroup: vehicleUserGroup,
                },
            });

            this.bgGeo.setConfig(config).then(() => {
                this.bgGeo.start();
            }).catch((err) => console.log('[LOCATION] Unable to start background tracking.', err));
        }
    }

    /**
     * Stop background geolocation tracking
     */
    stop(): void {
        if (this.bgGeo !== undefined && Globals.features.enableGeoTracking === true) { // for web usage, track only if feature is enabled
            this.bgGeo.stop();
        }
    }

    /**
     * Get current location details. `this.start()` is **not** required in order
     * for this function to work
     *
     * @returns {Promise<ILocation>}
     */
    getCurrentLocation(): Promise<ILocation> {
        if (this.bgGeo !== undefined) { // for web usage
            // lower sample count to reduce time taken to get location
            return this.bgGeo.getCurrentPosition({
                timeout: 10, // timeout to fetch location
                maximumAge: 10000, // accept the last-known-location if not older than x ms
                samples: 1,
            }).then((response) => ({
                coords: {
                    latitude: _get(response, 'coords.latitude'),
                    longitude: _get(response, 'coords.longitude'),
                    accuracy: _get(response, 'coords.accuracy'),
                },
            }));
        } else {
            return Promise.resolve({
                coords: {
                    latitude: undefined,
                    longitude: undefined,
                    accuracy: undefined,
                },
            });
        }
    }
}
