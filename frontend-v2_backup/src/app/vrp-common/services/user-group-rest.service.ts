import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { VrpHttpCache } from '@app/vrp-common/classes/vrp-http-cache';

@Injectable({ providedIn: 'root' })
export class VrpUserGroupRestService {

    constructor(
        private _http: HttpClient,
        @Inject('USER_GROUP_REST_BASE_URL') private baseUrl: string,
    ) {
        VrpHttpCache.http = this._http;
    }

    getAllUserGroups(forceRefresh: boolean = false): Observable<any> {
        const myUrl = `${this.baseUrl}/v2?projection=description`;
        return VrpHttpCache.get(myUrl, forceRefresh).pipe(map((userGroups) => {
            if (userGroups) {
                userGroups.forEach((s) => s.usergroup = s.usergroup.toUpperCase());
            }
            return userGroups;
        }));
    }

    createUserGroups(userGroups: any[]): Observable<any> {
        return this._http.post(`${this.baseUrl}/v2`, userGroups);
    }

    deleteUserGroups(usergroups: string[]): Observable<any> {
        return this._http.delete(`${this.baseUrl}/v2?usergroups=${usergroups.join(',')}`);
    }
}
