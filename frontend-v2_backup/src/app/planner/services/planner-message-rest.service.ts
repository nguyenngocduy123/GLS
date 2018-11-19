import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IPlannerMessage {
    _id?: any;
    job: any;
    fromUsername?: string;
    fromUser?: any;
    fromUserFullName?: string;
    processedBy?: any;
    processedByUsername?: string;
    processedByUserFullName?: string;
    processedAt?: Date;
    created_date?: Date;
    modified_date?: Date;
}

@Injectable({ providedIn: 'root' })
export class PlannerMessageRestService {

    constructor(
        private _http: HttpClient,
        @Inject('MESSAGE_REST_BASE_URL') private _baseUrl: string,
    ) { }

    getAll(startDate: Date, endDate: Date): Observable<IPlannerMessage[]> {
        return this._http.get<IPlannerMessage[]>(`${this._baseUrl}/v2?startDate=${startDate.toISODate()}&endDate=${endDate.toISODate()}`);
    }

    process(m: IPlannerMessage): Observable<any> {
        return this._http.put(`${this._baseUrl}/v2/process/${m._id}`, {});
    }

    getUnprocessedMessagesCount(): Observable<number> {
        return this._http.get<number>(`${this._baseUrl}/v2/unprocessedCount`);
    }
}
