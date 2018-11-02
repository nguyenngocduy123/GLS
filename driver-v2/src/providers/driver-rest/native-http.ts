/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable, Injector } from '@angular/core';
import { HTTP } from '@ionic-native/http';
import { HttpClient } from '@angular/common/http';

import { Globals } from '../../globals';
import { AuthProvider } from '../user/auth';
import { Network } from '@ionic-native/network';
import { Platform } from 'ionic-angular';

/**
 * Supported HTTP methods by this interceptor
 *
 * @enum IHTTPMethod
 */
enum HTTPMethod {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
}

// interceptor to prepend server url
@Injectable()
export class NativeHTTP extends HTTP {
    private useNativeHttp: boolean = false;

    constructor(
        public http: HttpClient,
        public injector: Injector,
        public network: Network,
        public platform: Platform,
    ) {
        super();

        // use HttpClient if on browser and native HTTP if on mobile platform
        // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/108
        this.useNativeHttp = (this.platform.is('ios') || this.platform.is('android'));

        console.log(`[API] Using Native HTTP ${this.useNativeHttp}`);
    }

    get(url: string, parameters: any = {}, headers: any = {}): Promise<any> {
        return this.sendRequestToServer(HTTPMethod.GET, [url, parameters, headers]);
    }

    post(url: string, body: any, headers: any = {}): Promise<any> {
        return this.sendRequestToServer(HTTPMethod.POST, [url, body, headers]);
    }

    put(url: string, body: any, headers: any = {}): Promise<any> {
        return this.sendRequestToServer(HTTPMethod.PUT, [url, body, headers]);
    }

    /**
     * @private
     * @param method  HTTP method to call
     * @param args  Arguments to pass into `method`. First element is always `url`.
     * @returns {Promise<any>}
     */
    sendRequestToServer(httpMethod: HTTPMethod, args: any[]): Promise<any> {
        const serverUrl = Globals.url;
        const originalUrl = args[0];
        const body = args[1] || {};
        let headers = args[2] || {};

        // set auth header only if indicated in globals file
        if (Globals.default.setApiHeader === true) {
            headers = { [Globals.default.apiHeader]: Globals.user.token };
        }

        // set correct url
        const url = `${serverUrl}/${originalUrl}`;

        console.log(`[API] Sending request to ${url}`, body, headers);

        if (this.network.type === 'none') {
            return Promise.reject({ error: 'Internet is required.' });
        }

        let promise: Promise<any>;
        if (this.useNativeHttp) {
            promise = super[httpMethod](url, body, headers);
        } else {
            const options = { withCredentials: true, headers: headers };
            // this section of codes can remove only when issue is resolved
            // @see https://github.com/silkimen/cordova-plugin-advanced-http/issues/108
            if (httpMethod === HTTPMethod.GET) {
                promise = this.http.get(url, Object.assign({ params: body }, options)).toPromise();
            } else {
                promise = this.http[httpMethod.toString()](url, body, options).toPromise();
            }
        }

        return promise.then((response) => {
            console.log(`[API] Success ${url}`, response);
            try {
                return JSON.parse(response.data);
            } catch (e) {
                return response;
            }
        }).catch((err) => {
            console.log(`[API] Error ${url}`, err);

            if (this.useNativeHttp) {
                try {
                    err.error = JSON.parse(err.error);
                } catch (e) { }
            } else {
                err.status = -1;
            }

            if (err.status === 401) {
                const auth = this.injector.get(AuthProvider); // injected here to prevent cyclic DI error
                auth.logout(); // force logout
            }
            throw err;
        });
    }
}
