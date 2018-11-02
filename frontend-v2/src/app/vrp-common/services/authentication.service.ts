import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { USER_ENVIRONMENT } from '@app/vrp-common/vrp-common.config';

@Injectable({ providedIn: 'root' })
export class VrpAuthenticationService {

    user: any = undefined;
    environment: any = {};
    redirectUrl: string; // store the URL so we can redirect after logging in

    constructor(
        private _http: HttpClient,
        @Inject('AUTHENTICATION_BASE_URL') private _baseUrl: string,
    ) { }

    saveUser(user: any) {
        if (user) {
            this.user = user;
            this._loadEnvironment();
        }
    }

    login(username: string, password: string): Observable<any> {
        return this._http.post(`${this._baseUrl}/v2/login`, { username: username, password: password }).pipe(
            tap((res) => this.saveUser(res)));
    }

    logout(): Observable<any> {
        sessionStorage.clear();
        this.user = undefined;
        return this._http.post(`${this._baseUrl}/v2/logout`, {});
    }

    isLoggedIn(): Observable<boolean> {
        return this._http.get(`${this._baseUrl}/v2/isLoggedIn`).pipe(
            map((res) => {
                if (res) {
                    this.user = res;
                    this._loadEnvironment();
                    return true;
                } else {
                    return false;
                }
            }),
        );
    }

    getUserName(): string {
        return this.user && this.user.username;
    }

    getUserId(): string {
        return this.user && this.user._id;
    }

    getUserFullName(): string {
        return this.user && this.user.full_name;
    }

    getUserGroup(): string {
        return this.user && this.user.usergroup;
    }

    isAdmin(): boolean {
        return this.user && this.user.role === 'admin';
    }

    isPlanner(): boolean {
        return this.user && (this.user.role === 'planner');
    }

    isPowerPlanner(): boolean {
        return this.isPlanner() && this.user && !this.user.usergroup;
    }

    isRestrictedPlanner(): boolean {
        return this.isPlanner() && this.user && this.user.usergroup;
    }

    isDriver(): boolean {
        return this.user && this.user.role === 'driver';
    }

    isDefaultUser(): boolean {
        return this.user && this.user.role === 'default';
    }

    isController(): boolean {
        return this.user && this.user.role === 'controller';
    }

    getDefaultUrlSegment(ignoreForceChangePassword: boolean = false): string[] {
        if (this.isChangePasswordRequired() && !ignoreForceChangePassword) {
            return ['settings', 'change-password'];
        } else {
            if (this.isPlanner()) {
                return ['planner', 'monitor', 'progress'];
            } else if (this.isAdmin()) {
                return ['user-management'];
            } else if (this.isDefaultUser()) {
                return ['cvrp', 'dashboard'];
            } else if (this.isController()) {
                return ['controller', 'monitor', 'progress'];
            } else {
                return ['login'];
            }
        }
    }

    isChangePasswordRequired(): boolean {
        // return false;
        return (this.user && this.user.forceChangePassword);
    }

    get theme(): string {
        return this.environment[USER_ENVIRONMENT.THEME.key] || USER_ENVIRONMENT.THEME.defaultValue;
    }

    set theme(val: string) {
        this.environment[USER_ENVIRONMENT.THEME.key] = val;
        this._saveEnvironment();
    }

    get jobBellNotification(): boolean {
        return this.environment[USER_ENVIRONMENT.JOB_BELL_NOTIFICATION.key] || USER_ENVIRONMENT.JOB_BELL_NOTIFICATION.defaultValue;
    }

    set jobBellNotification(val: boolean) {
        this.environment[USER_ENVIRONMENT.JOB_BELL_NOTIFICATION.key] = val;
        this._saveEnvironment();
    }

    get msgBellNotification(): boolean {
        const element = USER_ENVIRONMENT.MSG_BELL_NOTIFICATION;
        if (this.environment[element.key] === undefined) {
            return element.defaultValue;
        } else {
            return this.environment[element.key];
        }

    }

    set msgBellNotification(val: boolean) {
        this.environment[USER_ENVIRONMENT.MSG_BELL_NOTIFICATION.key] = val;
        this._saveEnvironment();
    }

    get dataToastNotification(): boolean {
        return this.environment[USER_ENVIRONMENT.DATA_TOAST_NOTIFICATION.key] || USER_ENVIRONMENT.DATA_TOAST_NOTIFICATION.defaultValue;
    }

    set dataToastNotification(val: boolean) {
        this.environment[USER_ENVIRONMENT.DATA_TOAST_NOTIFICATION.key] = val;
        this._saveEnvironment();
    }

    get msgToastNotification(): boolean {
        const element = USER_ENVIRONMENT.MSG_TOAST_NOTIFICATION;
        if (this.environment[element.key] === undefined) {
            return element.defaultValue;
        } else {
            return this.environment[element.key];
        }
    }

    set msgToastNotification(val: boolean) {
        this.environment[USER_ENVIRONMENT.MSG_TOAST_NOTIFICATION.key] = val;
        this._saveEnvironment();
    }

    get primaryGeocodingService(): string {
        return this.environment[USER_ENVIRONMENT.PRIMARY_GEOCODING_SERVICE.key] || USER_ENVIRONMENT.PRIMARY_GEOCODING_SERVICE.defaultValue;
    }

    set primaryGeocodingService(val: string) {
        this.environment[USER_ENVIRONMENT.PRIMARY_GEOCODING_SERVICE.key] = val;
        this._saveEnvironment();
    }

    private _saveEnvironment() {
        localStorage.setItem(this.getUserId(), JSON.stringify(this.environment)); // save to local storage
    }

    private _loadEnvironment() {
        try {
            this.environment = JSON.parse(localStorage.getItem(this.getUserId())) || {};
        } catch (err) {
            console.error('VrpAuthenticationService - loadEnvironment error', err);
        }
    }
}
