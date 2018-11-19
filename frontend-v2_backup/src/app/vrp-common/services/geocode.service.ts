import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { VrpHttpCache } from '@app/vrp-common/classes/vrp-http-cache';

@Injectable({ providedIn: 'root' })
export class VrpGeocodeService {

    constructor(
        private _http: HttpClient,
        @Inject('MAP_REST_BASE_URL') private _baseUrl: string,
    ) {
        VrpHttpCache.http = this._http;
    }

    geocode(postals: string[]): Observable<any> {
        const myUrl = `${this._baseUrl}/v2/geocode`;
        const addresses = postals.map((postal) => ({ postal: postal }));
        return this._http.post(myUrl, { addresses: addresses });
    }

    searchAddress(str: string): Observable<any> {
        return VrpHttpCache.get(`${this._baseUrl}/v2/searchAddress?service=onemap&postal=${str}`);
    }

    createPostals(addresses: any[]): Observable<any> {
        const myUrl = `${this._baseUrl}/v2/coords`;
        return this._http.post(myUrl, { addresses: addresses }, { responseType: 'text' });
    }

    removePostal(postal: string): Observable<any> {
        const myUrl = `${this._baseUrl}/v2/coords/${postal}`;
        return this._http.delete(myUrl, { responseType: 'text' });
    }
}
