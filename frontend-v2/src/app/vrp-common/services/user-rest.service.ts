import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { VrpHttpCache } from '@app/vrp-common/classes/vrp-http-cache';
import { IVrpUser } from '@app/vrp-common/classes/vrp-user';

@Injectable({ providedIn: 'root' })
export class VrpUserRestService {

    private readonly _projection: string = `username,usergroup,fullname,modified_date,role,email,phone,isOnline,disabled,disabled_date,note`;

    constructor(
        private _http: HttpClient,
        @Inject('USER_BASE_URL') private baseUrl: string,
    ) {
        VrpHttpCache.http = this._http;
    }

    getAllDriverUsers(forceRefresh: boolean = false): Observable<IVrpUser[]> {
        const myUrl = `${this.baseUrl}/v2?roles=driver&projection=username,fullname,disabled`;
        return VrpHttpCache.get(myUrl, forceRefresh);
    }

    getAllUsers(forceRefresh: boolean = false): Observable<IVrpUser[]> {
        const myUrl = `${this.baseUrl}/v2?projection=${this._projection}`;
        return VrpHttpCache.get(myUrl, forceRefresh);
    }

    get(username: string, forceRefresh: boolean = false): Observable<IVrpUser> {
        const myUrl = `${this.baseUrl}/v2?userNames=${username}&projection=${this._projection}`;
        return VrpHttpCache.get(myUrl, forceRefresh).pipe(map((res) => res[0]));
    }

    create(user: IVrpUser): Observable<any> {
        const myUrl = `${this.baseUrl}/v2`;
        return this._http.post(myUrl, user);
    }

    updatePassword(currentPassword: string, newPassword: string): Observable<any> {
        const myUrl = `${this.baseUrl}/v2/password`;
        return this._http.put(myUrl, { oldPassword: currentPassword, newPassword: newPassword });
    }

    resetPassword(usernames: string[]): Observable<any> {
        const myUrl = `${this.baseUrl}/v2/resetPassword`;
        return this._http.post(myUrl, { usernames });
    }

    logoutByUsernames(usernames: string[]): Observable<any> {
        const myUrl = `${this.baseUrl}/v2/forceLogout`;
        return this._http.post(myUrl, { usernames }, { responseType: 'text' });
    }

    delete(usernames: string[]): Observable<any> {
        const myUrl = `${this.baseUrl}/v2?usernames=${usernames.join(',')}`;
        return this._http.delete(myUrl);
    }

    toggleUsers(usernames: string[], toDisable: boolean) {
        const myUrl = `${this.baseUrl}/v2/${toDisable ? 'disable' : 'enable'}`;
        return this._http.patch(myUrl, { usernames });
    }

    update(user: IVrpUser) {
        return this._http.put(`${this.baseUrl}/v2`, { user });
    }
}
