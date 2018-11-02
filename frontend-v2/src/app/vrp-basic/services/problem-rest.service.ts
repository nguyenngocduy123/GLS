import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { VrpHttpCache } from '@app/vrp-common';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';

import { Problem } from '@app/vrp-basic/classes/problem';

@Injectable({ providedIn: 'root' })
export class VrpProblemRestService {

    constructor(
        private _http: HttpClient,
        @Inject('PROBLEM_REST_BASE_URL') private _baseUrl: string,
    ) {
        VrpHttpCache.http = this._http;
    }

    get(id: string, forceRefresh: boolean = false): Observable<Problem> {
        return VrpHttpCache.get(`${this._baseUrl}/v2/p-${id}`, forceRefresh).pipe(map((res) => new Problem(res)));
    }

    update(id: string, problem: Problem): Observable<Problem> {
        const update: Object = problem;
        const url = `${this._baseUrl}/v2/${id}/update`;
        return this._http.patch(url, { update }).pipe(map((res) => new Problem(res)));
    }

    updateField(problemId: string, fieldName: string, fieldData: any): Observable<Problem> {
        return this._http.post(`${this._baseUrl}/v2/${problemId}/${fieldName}`, fieldData).pipe(map((res) => new Problem(res)));
    }

    create(problem: Problem): Observable<any> {
        return this._http.post(`${this._baseUrl}/v2/`, problem).pipe(map((res) => new Problem(res)));
    }

    delete(problemIds: string[]): Observable<any> {
        return this._http.post(`${this._baseUrl}/v2/destroy`, { ids: problemIds });
    }

    getAbstractProblem(forceRefresh: boolean = false): Observable<any> {
        return VrpHttpCache.get(`${this._baseUrl}/v2/abstract`, forceRefresh);
    }

    geocode(problemId: string, service: 'onemap' | 'baidu' | 'gmap' = 'onemap', alternativeServices: string = 'user,gmap,bdmap', saveToDb: boolean = true): Observable<Problem> {
        const url: string = `${this._baseUrl}/v2/geocode/${problemId}?service=${service}&alternativeServices=${alternativeServices}&saveToDb=${saveToDb}`;
        console.log('VrpProblemRestService -> url', url);
        return this._http.post(url, {}).pipe(map((res) => new Problem(res)));
    }

    queryDistanceMatrix(problemId: string): Observable<any> {
        return this._http.get(`${this._baseUrl}/v2/distanceMatrix/${problemId}`);
    }

    optimize(problemId: string, settings: any): Observable<any> {
        return this._http.post(`${this._baseUrl}/v2/optimize/${problemId}`, settings);
    }

    deleteItems(id: string, fieldName: string, itemIds: string[]) {
        const update: Object = { [`${fieldName}`]: { id: { $in: itemIds } } };
        const url = `${this._baseUrl}/v2/${id}/remove`;
        return this._http.patch(url, { update }).pipe(map((res) => new Problem(res)));
    }

    updateItem(id: string, fieldName: string, itemId: string, itemData: any): Observable<Problem> {
        const query: Object = { [`${fieldName}.id`]: itemId };
        const update: Object = { [`${fieldName}.$`]: itemData };
        const url = `${this._baseUrl}/v2/${id}/update`;
        return this._http.patch(url, { query, update }).pipe(map((res) => new Problem(res)));
    }
}
