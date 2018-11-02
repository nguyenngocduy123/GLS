/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { BackgroundMode } from '@ionic-native/background-mode';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { trim as _trim } from 'lodash-es';
import * as moment from 'moment';

import { Globals, StorageKey } from '../../globals';
import { AuthResponse } from './auth-response';
import { AuthApi } from '../driver-rest/driver-rest';
import { NotificationProvider } from '../notification/notification';
import { UserDriverProvider } from '../user/user-driver';
import { StorageProvider } from '../storage/storage';
import { OperatingSystem, DiagnosticProvider } from '../diagnostic/diagnostic';
import { WebsocketEvent, WebsocketProvider } from '../websocket/websocket';

@Injectable()
export class AuthProvider {
    /**
     * Observable to notify whenever there is authenticated status change
     *
     * @type {BehaviorSubject<boolean>}
     */
    notifier: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(undefined);
    username: string;
    forceChangePassword: boolean = false;

    constructor(
        public authApi: AuthApi,
        public backgroundMode: BackgroundMode,
        public diagnostic: DiagnosticProvider,
        public driver: UserDriverProvider,
        public notify: NotificationProvider,
        public storage: StorageProvider,
        public websocket: WebsocketProvider,
    ) { }

    /**
     * Logs into server
     *
     * @param {string} username  Username of user
     * @param {string} password  Password of user
     * @returns {Promise<void>}  Throws error (if unable to authenticate)
     */
    login(username: string, password: string): Promise<void> {
        return this.authApi.login({ username: username, password: password })
            .then((userDetails: AuthResponse) => {
                this.initUser(userDetails);
                this.driver.initDriver(userDetails); // assume user is always driver
            })
            .catch((err) => {
                this.resetUser(); // clear any existing data if any
                throw err;
            });
    }

    /**
     * Logs out of server. If there is no Internet, variables will still
     * be reset, but when Internet is established again, the user will be
     * redirected to home page
     *
     * @returns {Promise<any>}
     */
    logout(): Promise<void> {
        if (this.username === undefined) {
            this.notifier.next(false); // in case session is removed on server side while using
            return Promise.resolve();
        }

        return this.authApi.logout().then(() => {
            this.resetUser();
        }).catch(() => {
            this.resetUser();
            // ignore any server errors
        });
    }

    /**
     * Checks if user is logged in
     *
     * @returns {Promise<void>}  Throws error (if unable to authenticate)
     */
    isLoggedIn(): Promise<void> {
        return this.authApi.isLoggedIn()
            .then((userDetails) => {
                this.setUser(userDetails);
                this.driver.setDriver(userDetails); // assume user is always driver
            })
            .catch((err) => {
                this.resetUser();
                throw err;
            });
    }

    /**
     * Change user password
     *
     * @param {string} oldPw  Current password
     * @param {string} newPw  New password
     * @returns {Promise<void>}
     */
    changePassword(oldPw: string, newPw: string): Promise<void> {
        return this.authApi.resetPassword({
            oldPassword: oldPw,
            newPassword: newPw,
        });
    }

    /**
     * Initialise user, regardless of role. This function should only be called once
     *
     * @private
     * @param {AuthResponse} userDetails  User object from server
     */
    private initUser(userDetails: AuthResponse): void {
        console.log('[INIT] Initialising user');

        this.setUser(userDetails);

        if (this.diagnostic.deviceOS === OperatingSystem.iOS) {
            // android can listen to websocket messages in the background
            this.backgroundMode.enable();
        }

        this.initWebsocketEvents();
    }

    /**
     * Set user details based on settings from server
     *
     * @private
     * @param {AuthResponse} userDetails  User object from server
     */
    private setUser(userDetails: AuthResponse): void {
        console.log('[INIT] Setting user variables');

        Globals.user.token = userDetails.token;
        this.storage.setKeyValue(StorageKey.ApiToken, Globals.user.token);

        Globals.user.username = userDetails.username;
        this.username = Globals.user.username;
        this.storage.setKeyValue(StorageKey.Username, Globals.user.username);

        this.forceChangePassword = userDetails.forceChangePassword;

        this.synchroniseDate(userDetails.serverDate);

        this.notifier.next(true);
    }

    /**
     * Reset user variables, regardless of role
     *
     * @private
     */
    private resetUser(): void {
        Globals.user.token = '';
        Globals.user.previousJobsInfo = '';
        Globals.user.vehicleId = '';
        Globals.user.vehiclePlateNumber = '';
        Globals.user.vehicleUserGroup = '';
        this.storage.setKeyValue(StorageKey.ApiToken, '');
        this.storage.setKeyValue(StorageKey.PreviousJobsInfo, '');

        this.username = undefined;
        // for the convenience of subsequent log in, no need to reset storage username

        this.websocket.disconnect();

        this.driver.resetDriver();

        if (this.backgroundMode.isEnabled) {
            this.backgroundMode.disable();
        }

        // even though api intercepter will update notifier to false, but in case no internet connectivity when logout
        this.notifier.next(false);
    }

    /**
     * Synchronise local device datetime with server datetime
     *
     * @private
     * @param {string} serverTime  Date in ISO8601 format
     */
    private synchroniseDate(serverTime: string): void {
        serverTime = _trim(serverTime);
        if (serverTime) {
            const offset = new Date(serverTime).getTime() - Date.now();
            (moment as any).now = () => { // type casting is meant to overrule the readonly rule
                return offset + Date.now();
            };
        }
    }

    /**
     * Initialise all generic users websocket message events
     *
     * @private
     */
    private initWebsocketEvents(): void {
        this.websocket.connect();
        this.websocket.onJSON(WebsocketEvent.Logout, () => {
            this.notify.error('You are forced to log out. You will be redirected to login page.');
            this.resetUser();
        });
    }
}
