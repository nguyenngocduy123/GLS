/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { trim as _trim, get as _get } from 'lodash-es';

import { AppVersion } from '@ionic-native/app-version';
import { Diagnostic } from '@ionic-native/diagnostic';

import { Globals } from '../../globals';
import { MiscApi } from '../driver-rest/driver-rest';
import { NotificationProvider } from '../notification/notification';

/**
 * List of supported operating systems
 *
 * @enum {string}
 */
export enum OperatingSystem {
    Android = 'android',
    iOS = 'ios',
}

@Injectable()
export class DiagnosticProvider {
    /**
     * Observable to notify whenever gps is turned on or off
     *
     * @type {BehaviorSubject<boolean>}
     */
    hasLocationNotifier: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    deviceOS: OperatingSystem;
    deviceVersion: number;

    constructor(
        public appVersion: AppVersion,
        public diagnostic: Diagnostic,
        public miscApi: MiscApi,
        public notify: NotificationProvider,
        public platform: Platform,
    ) {
        this.platform.ready().then(() => {
            // get device operating system
            if (this.platform.is(OperatingSystem.Android) === true) {
                this.deviceOS = OperatingSystem.Android;
            } else if (this.platform.is(OperatingSystem.iOS) === true) {
                this.deviceOS = OperatingSystem.iOS;
            }

            // get device os version
            const platforms = this.platform.versions();
            this.deviceVersion = _get(platforms[this.deviceOS], 'num');

            // registerLocationStateChangeHandler only detect GPS on Android platform and Location service On or Off on iOS platform
            this.diagnostic.registerLocationStateChangeHandler((state) => {
                // getLocationAuthorizationStatus can detect location permission status for both iOS and Android platform
                this.diagnostic.getLocationAuthorizationStatus().then((statusPermission) => {
                    const isOnAndroid = (this.deviceOS === OperatingSystem.Android && state !== this.diagnostic.locationMode.LOCATION_OFF && statusPermission !== this.diagnostic.permissionStatus.NOT_REQUESTED);
                    const isOniOS = (this.deviceOS === OperatingSystem.iOS && (statusPermission === this.diagnostic.permissionStatus.GRANTED || statusPermission === this.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE));
                    if (isOnAndroid === true || isOniOS === true) {
                        this.hasLocationNotifier.next(true);
                    } else {
                        this.hasLocationNotifier.next(false);
                    }
                });
            });
        });
    }

    /**
     * Compare current installed app version with minimum version specified by server.
     * Default return value is `true` if any error occur
     *
     * @returns {Promise<boolean>}  True if app is updated
     */
    isAppUpdated(): Promise<boolean> {
        if (Globals.features.forceAppUpdate === false) { // assume app is updated if feature is not enabled
            return Promise.resolve(true);
        } else {
            return this.appVersion.getVersionNumber().then((version) => {
                console.log(`[DIAGNOSTIC] Current app version ${version}`);
                if (version === undefined) {
                    return true;
                } else {
                    return this.miscApi.getLatestAppVersion().then((latestVersion) => {
                        console.log(`[DIAGNOSTIC] Latest app version ${latestVersion}`);
                        return this.normalizeVersionNum(version) >= this.normalizeVersionNum(latestVersion);
                    });
                }
            }).catch(() => true);
        }
    }

    /**
     * Get application package name (e.g. widget id for Android)
     *
     * @returns {Promise<string>}
     */
    getPackageName(): Promise<string> {
        return this.appVersion.getPackageName();
    }

    /**
     * Check if gps is enabled and if app is permitted to get gps coordinates.
     * `.catch()` is not necessary as no errors will be thrown
     *
     * @returns {Promise<boolean>}  True if gps is enabled and permission given
     */
    hasLocationPermission(): Promise<boolean> {
        return this.diagnostic.isLocationAvailable().then((available) => {
            this.hasLocationNotifier.next(available);
            return available;
        }).catch((err) => this.catch('location', err));
    }

    /**
     * Check if camera exists and if app is permitted to use camera.
     * `.catch()` is not necessary as no errors will be thrown
     *
     * @returns {Promise<boolean>}  True if camera exists and permission given
     */
    hasCameraPermission(): Promise<boolean> {
        return this.diagnostic.isCameraAvailable().catch((err) => this.catch('camera', err));
    }

    /**
     * Request for location permission. Toast will appear if app already has permission.
     * `.catch()` is not necessary as no errors will be thrown
     */
    requestLocation(): void {
        this.diagnostic.isLocationAvailable().then((available) => {
            if (available === true) {
                this.hasLocationNotifier.next(available);
                this.notify.info('Location permission is already enabled.');
            } else {
                return this.diagnostic.getLocationAuthorizationStatus()
                    .then((statusPermission) => {
                        this.diagnostic.isLocationEnabled().then((isGpsOn) => {
                            if (this.platform.is('android')) {
                                if (!isGpsOn) {
                                    // For GPS off but permission is on condition Android Platform
                                    this.diagnostic.switchToLocationSettings();
                                } else if (statusPermission === this.diagnostic.permissionStatus.DENIED || statusPermission === this.diagnostic.permissionStatus.DENIED_ALWAYS || statusPermission === this.diagnostic.permissionStatus.NOT_REQUESTED) {
                                    // For location permission is off condition Android Platform
                                    this.diagnostic.switchToLocationSettings();
                                }
                            } else {
                                if (!isGpsOn) {
                                    // For GPS is off on iOS platform
                                    this.notify.info('Please go to Setting >> Privacy >> Location Services to turn on your Location service.');
                                } else if (statusPermission === this.diagnostic.permissionStatus.DENIED || statusPermission === this.diagnostic.permissionStatus.DENIED_ALWAYS || statusPermission === this.diagnostic.permissionStatus.NOT_REQUESTED) {
                                    // For location permission is off condition iOS platform
                                    this.diagnostic.switchToSettings();
                                }
                            }
                        });
                    });
            }
        }).catch((err) => this.catch('location', err));
    }

    /**
     * Request for camera permission. Toast will appear if app already has permission.
     * `.catch()` is not necessary as no errors will be thrown
     */
    requestCamera(): void {
        this.diagnostic.isCameraAvailable().then((available) => {
            if (available === true) {
                this.notify.info('Camera permission is already enabled.');
            } else {
                this.diagnostic.requestCameraAuthorization();
            }
        }).catch((err) => this.catch('camera', err));
    }

    /**
     * Generic error handler. All errors are counted as resolved (i.e. no errors will be re-thrown)
     *
     * @private
     * @param {('location' | 'camera')} permission  Type of permission that caused the error
     * @param {string} err  Error message
     * @returns {boolean}  Returns `true` always
     */
    private catch(permission: 'location' | 'camera', err: string): boolean {
        // ignore error, can't be helped due to device issue
        if (permission === undefined) {
            this.notify.error(`Unable to check ${permission} permission details ${err}`);
        }
        return true; // return true to assume promise is resolved
    }

    /**
     * Normalises all version numbering for easier comparison. Returns `0` if version
     * provided is invalid (e.g. contains letters)
     *
     * @private
     * @param {string} version  Original version number, can be
     * @returns {number}
     */
    private normalizeVersionNum(version: string): number {
        const normVersion = Number(_trim(version).replace(/\./g, ''));
        return isNaN(normVersion) ? 0 : normVersion;
    }
}
