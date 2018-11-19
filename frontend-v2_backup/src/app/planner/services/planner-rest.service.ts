import { Inject, Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { omit as _omit } from 'lodash-es';

import { VrpHttpCache } from '@app/vrp-common';
import { Problem } from '@app/vrp-basic/classes/problem';

export type SqlTableNames = 'DeliveryMaster' | 'DeliveryDetail' | 'DeliveryItem' | 'VehicleType' | 'Vehicle' | 'Item';
export type DuplicatesTableNames = 'vehicle' | 'order'; // for api link only

export interface IVrpPlannerDeliveryItems {
    ItemQty: number;
    ItemId: string;
}

@Injectable({ providedIn: 'root' })
export class PlannerRestService {

    private _datePipe: DatePipe = new DatePipe('en-US');

    constructor(
        private _http: HttpClient,
        @Inject('PLANNER_REST_BASE_URL') private _baseUrl: string,
    ) {
        VrpHttpCache.http = this._http;
    }

    findInCachedData(urlSubStr: string) {
        return VrpHttpCache.getCacheData(urlSubStr);
    }

    getSummary(startDate: Date, endDate: Date, forceRefresh: boolean = false): Observable<any> {
        const url = `${this._baseUrl}/v2.1/misc/summary?` + this._getDateRange(startDate, endDate);
        return VrpHttpCache.get(url, forceRefresh).pipe(map((res) => {
            return res;
        }));
    }

    queryDeliveryMasters(startDate: Date, endDate: Date = undefined, query: any = undefined, forceRefresh: boolean = false): Observable<any[]> {
        const where = query ? `where=${JSON.stringify(query)}&` : '';
        const url = `${this._baseUrl}/v2.1/order?${where}` + this._getDateRange(startDate, endDate);
        return VrpHttpCache.get(url, forceRefresh, { tableName: 'DeliveryMaster', startDate, endDate });
    }

    getDeliveryMaster(orderId: string, forceRefresh: boolean = false) {
        const url = `${this._baseUrl}/v2.1/order/${orderId}`;
        return VrpHttpCache.get(url, forceRefresh, { tableName: 'DeliveryMaster', orderId });
    }

    getDeliveryDetails(startDate: Date, endDate: Date = undefined, query: any = undefined, forceRefresh: boolean = false): Observable<any[]> {
        const where = query ? `where=${JSON.stringify(query)}&` : '';
        const url = `${this._baseUrl}/v2.1/job?${where}` + this._getDateRange(startDate, endDate);
        return VrpHttpCache.get(url, forceRefresh, { tableName: 'DeliveryDetail', startDate, endDate }).pipe(tap((res) => {
            res.forEach((d) => {
                const order = d.DeliveryMaster;
                const jobProp = (order.DeliveryDetails && order.DeliveryDetails.length >= 2) ? 'SHIPMENT' : 'SERVICE';
                d.JobProp = jobProp;
                d.VehicleId = order.VehicleId;
                d.Priority = order.Priority;
                d.VehicleRestriction = order.VehicleRestriction;
                d.UserGroup = order.UserGroup;
            });
        }));
    }

    getVehicles(ids: string[] = undefined, forceRefresh: boolean = false): Observable<any> {
        let url = `${this._baseUrl}/v2.1/vehicle`;
        if (ids) {
            const where = JSON.stringify({ Id: ids });
            url += `?where=${where}`;
        }

        return VrpHttpCache.get(url, forceRefresh, { tableName: 'Vehicle' });
    }

    getItems(forceRefresh: boolean = false): Observable<any[]> {
        const url = `${this._baseUrl}/v2.1/item`;
        return VrpHttpCache.get(url, forceRefresh, { tableName: 'Item' });
    }

    getTransactionLogFile(startDate: Date, endDate: Date = undefined, withPhotos: boolean = false): Observable<any> {
        const url = `${this._baseUrl}/v2.1/files/transactionLog?withPhotos=${withPhotos}&` + this._getDateRange(startDate, endDate);
        return this._http.get(url, { responseType: 'blob' });
    }

    approvePlan(solution: any) {
        const url = `${this._baseUrl}/v2.1/plan`;
        return this._http.put(url, { solution: solution });
    }

    getPOD(jobId: string) {
        const url = `${this._baseUrl}/v2.1/pod/${jobId}`;
        return VrpHttpCache.get(url);
    }

    getDeliveryNote(jobId: string) {
        const url = `${this._baseUrl}/v2.1/note/${jobId}`;
        return VrpHttpCache.get(url);
    }

    getVehicleTypes(forceRefresh: boolean = false): Observable<any> {
        const url = `${this._baseUrl}/v2.1/vehicleType`;
        return VrpHttpCache.get(url, forceRefresh);
    }

    optimize(orders: any[], vehicles: any[], date: Date, options: any): Observable<any> {
        const orderIds = orders.map((o) => o.Id).join(',');
        const vehicleIds = vehicles.map((o) => o.Id).join(',');
        const optionStr = Object.keys(options).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(options[k]);
        }).join('&');

        const url = `${this._baseUrl}/v2.1/plan/optimize?vehicleIds=${vehicleIds}&orderIds=${orderIds}&date=${this._getISODateString(date)}&${optionStr}`;

        return this._http.get(url);
    }

    update(data: any, tableName: SqlTableNames): Observable<any> {
        let myUrl;
        const body = { newValues: _omit(data, ['Id']) };
        switch (tableName) {
            case 'DeliveryMaster':
                myUrl = `${this._baseUrl}/v2.1/order/${data.Id}`;
                break;
            case 'DeliveryDetail':
                myUrl = `${this._baseUrl}/v2.1/job/${data.Id}`;
                break;
            case 'DeliveryItem':
                myUrl = `${this._baseUrl}/v2.1/jobItem/${data.Id}`;
                break;
            case 'Item':
                myUrl = `${this._baseUrl}/v2.1/item/${data.Id}`;
                break;
            case 'VehicleType':
                myUrl = `${this._baseUrl}/v2.1/vehicleType/${data.Id}`;
                break;
            case 'Vehicle':
                myUrl = `${this._baseUrl}/v2.1/vehicle/${data.Id}`;
                break;
            default:
                break;
        }

        console.debug('update', tableName, body);
        return this._http.put(myUrl, body);
    }

    create(data: any, tableName: SqlTableNames, Id: String = 'undefined') {
        let myUrl;
        switch (tableName) {
            case 'DeliveryMaster':
                myUrl = `${this._baseUrl}/v2.1/order`;
                break;
            case 'DeliveryDetail':
                myUrl = `${this._baseUrl}/v2.1/job`;
                break;
            case 'DeliveryItem':
                myUrl = `${this._baseUrl}/v2.1/job/${Id}/item`;
                break;
            case 'Item':
                myUrl = `${this._baseUrl}/v2.1/item`;
                break;
            case 'VehicleType':
                myUrl = `${this._baseUrl}/v2.1/vehicleType`;
                if (data instanceof Array) {
                    data = data.map((d) => _omit(d, ['Id']));
                } else {
                    data = _omit(data, ['Id']);
                }
                break;
            case 'Vehicle':
                myUrl = `${this._baseUrl}/v2.1/vehicle`;
                break;
            default:
                alert('That should not happen');
                break;
        }
        return this._http.post(myUrl, { record: data });
    }

    deleteMany(ids: string[], tableName: SqlTableNames): Observable<any> {
        let myUrl;
        switch (tableName) {
            case 'DeliveryMaster':
                myUrl = `${this._baseUrl}/v2.1/order/destroy`;
                break;
            case 'DeliveryDetail':
                myUrl = `${this._baseUrl}/v2.1/job/destroy`;
                break;
            case 'DeliveryItem':
                myUrl = `${this._baseUrl}/v2.1/jobItem/destroy`;
                alert('Destroy API for DeliveryItems are not applicable');
                return;
            case 'Item':
                myUrl = `${this._baseUrl}/v2.1/item/destroy`;
                break;
            case 'VehicleType':
                myUrl = `${this._baseUrl}/v2.1/vehicleType/destroy`;
                break;
            case 'Vehicle':
                myUrl = `${this._baseUrl}/v2.1/vehicle/destroy`;
                break;
            default:
                alert('That should not happen');
                break;
        }

        return this._http.post(myUrl, { ids });
    }

    checkForDuplicates(ids: string[], tableName: DuplicatesTableNames): Observable<any> {
        const url = `${this._baseUrl}/v2.1/${tableName}/duplicates`;
        return this._http.post(url, { ids });
    }

    deleteDeliveryItemsOfJob(jobId: string[]): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/job/${jobId}/item`;
        return this._http.delete(myUrl);
    }

    replaceDeliveryItemsOfJob(jobId: string[], items: IVrpPlannerDeliveryItems[]): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/job/${jobId}/item`;
        return this._http.put(myUrl, { record: items });
    }

    getVerificationCode(jobId: string): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/code/${jobId}`;
        return this._http.get(myUrl);
    }

    createVerificationCode(jobId: string, code: number): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/code/${jobId}`;
        return this._http.post(myUrl, { record: { Code: code } });
    }

    updateVerificationCode(jobId: string, code: number): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/code/${jobId}`;
        return this._http.put(myUrl, { newValues: { Code: code } });
    }

    deleteVerificationCode(jobId: string): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/code/${jobId}`;
        return this._http.delete(myUrl);
    }

    // upsertVerificationCode(jobId: string, code: number): Observable<any> {
    // 	console.log('upsertVerificationCode', code);
    // 	if (code) {
    // 		return this.getVerificationCode(jobId).pipe(
    // 			mergeMap((foundCode) => {
    // 				if (foundCode) {
    // 					return this.updateVerificationCode(jobId, code);
    // 				} else {
    // 					return this.createVerificationCode(jobId, code);
    // 				}
    // 			}),
    // 		);
    // 	} else {
    // 		return this.deleteVerificationCode(jobId);
    // 	}
    // }

    notify(data) {
        const myUrl = `${this._baseUrl}/v2.1/code/${data.jobId}/notify`;
        return this._http.post(myUrl, { record: data });
    }

    getProblemJson(date: Date, forceRefresh: boolean = true): Observable<any> {
        // let myUrl = `${this._baseUrl}/v2/misc/getProblemJson?${this._getDateRange(date)}`;
        const myUrl = `${this._baseUrl}/v2.1/plan/problem?${this._getDateRange(date)}`;
        return VrpHttpCache.get(myUrl, forceRefresh).pipe(map((p) => new Problem(p)));
    }

    getExcelTemplate(): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/files/template`;
        return this._http.get(myUrl, { responseType: 'blob' });
    }

    getVehicleLastLocation(): Observable<any> {
        const myUrl = `${this._baseUrl}/v2.1/vehicleLog/last`;
        return this._http.get(myUrl);
    }

    private _getDateRange(startDate: Date, endDate: Date = undefined): string {
        if (startDate) {
            return (endDate) ? `startDate=${this._getISODateString(startDate)}&endDate=${this._getISODateString(endDate)}` : `date=${this._getISODateString(startDate)}`;
            // return `startDate=${this._getISODateString(startDate)}&endDate=${this._getISODateString(endDate|| startDate)}`;
        } else {
            return '';
        }
    }

    private _getISODateString(d: Date): string {
        return this._datePipe.transform(d, 'yyyy-MM-dd');
    }
}
