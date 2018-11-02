/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { HTTPResponse } from '@ionic-native/http';
import { map as _map } from 'lodash-es';

import { NativeHTTP } from './native-http';
import { Job, AttemptedJob } from '../classes/job';
import { Item } from '../classes/item';
import { AuthResponse } from '../user/auth-response';

class CustomErrorHandler {
    static catch(err: HTTPResponse): never {
        if (err.status === 0) {
            throw new Error(`Invalid URL. Error: ${err.error}`);
        } else if (err.status === -1 && err.error) {
            throw err.error.split('Exception: ').pop();
        } else {
            throw err.error;
        }
    }
}

@Injectable()
export class AuthApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    isLoggedIn(): Promise<AuthResponse> {
        return this.http.get('web/auth/v2/isLoggedIn')
            .then((result) => new AuthResponse(result))
            .catch(CustomErrorHandler.catch);
    }

    resetPassword(data: any = {}): Promise<void> {
        return this.http.put('api/user/v2/password', data)
            .catch(CustomErrorHandler.catch);
    }

    login(data: any = {}): Promise<AuthResponse> {
        return this.http.post('api/auth/v2/login', data)
            .then((result) => new AuthResponse(result))
            .catch((err: HTTPResponse) => {
                let msg = err.error;
                if (err.status === 401) {
                    msg = 'Incorrect username or password.';
                } else if (err.status === 0 || err.status === 404) {
                    msg = 'Please check that the server URL is valid.';
                } else if (err.status === -1 && err.error) {
                    msg = `Unable to log in. ${err.error.split('Exception: ').pop()}`;
                } else if (typeof msg !== 'string') {
                    msg = `Unable to log in. ${JSON.stringify(msg)}`;
                }
                throw msg;
            });
    }

    logout(): Promise<void> {
        return this.http.post('api/auth/v2/logout', {})
            .catch(CustomErrorHandler.catch);
    }
}

@Injectable()
export class JobsApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    get(params: any = {}): Promise<Job[]> {
        return this.http.get('web/data/v2.1/job', params)
            .then((result) => _map(result, (job) => new Job(job)))
            .catch(CustomErrorHandler.catch);
    }

    attempt(body: AttemptedJob): Promise<Job> {
        // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/63
        // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/101
        return this.http.put(`api/data/v2.1/job/${body.jobId}/attemptB64`, body.withBase64())
            .catch(CustomErrorHandler.catch);
    }

    sync(body: AttemptedJob[] = []): Promise<void> {
        // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/63
        // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/101
        return this.http.post(`api/data/v2.1/job/syncB64`, _map(body, (job) => job.withBase64()))
            .catch(CustomErrorHandler.catch);
    }

    getPodPhotos(jobId: number): Promise<{ Signature: string, Photo: string }> {
        return this.http.get(`web/data/v2.1/pod/${jobId}`)
            .catch(CustomErrorHandler.catch);
    }

    getNotePhotos(jobId: number): Promise<string[]> {
        return this.http.get(`web/data/v2.1/note/${jobId}`)
            .catch(CustomErrorHandler.catch);
    }
}

@Injectable()
export class ItemApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    get(itemId: string): Promise<Item> {
        return this.http.get(`web/data/v2.1/item/${itemId}`)
            .then((result) => new Item(result))
            .catch(CustomErrorHandler.catch);
    }
}

@Injectable()
export class VehicleApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    update(vehicleId: string, data: object): Promise<void> {
        return this.http.put(`api/data/v2.1/vehicle/${vehicleId}`, { newValues: data })
            .catch(CustomErrorHandler.catch);
    }
}

@Injectable()
export class MiscApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    getLatestAppVersion(): Promise<string> {
        return this.http.get('web/data/v2.1/misc/app/version', {}, { 'Content-Type': 'application/text' })
            .catch(CustomErrorHandler.catch);
    }
}

export interface IMailApiRequest {
    jobs: Job[];
    lateBy: string;
    driverRemarks: string;
}

@Injectable()
export class MailApi {
    constructor(
        public http: NativeHTTP,
    ) { }

    send(data: IMailApiRequest): Promise<void> {
        return this.http.post('api/message/v2', data)
            .catch(CustomErrorHandler.catch);
    }
}
