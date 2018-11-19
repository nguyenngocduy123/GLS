import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { get as _get } from 'lodash-es';

@Injectable()
export class VrpMapService {

    constructor(
        private _http: HttpClient,
        @Inject('MAP_BASE_URL') private _baseUrl: string,
    ) { }

    getOSMRoute(coord: any[]): Observable<any> {
        const _coord = coord.map((c) => [c.lat, c.lng || c.lon]);
        return this._http.post(`${this._baseUrl}/v2/route`, { coordinates: _coord }).pipe(
            map((res) => {
                const geometry = _get(res, 'routes[0].geometry');
                const path = this._decodePath(geometry);
                const distance = _get(res, 'routes[0].distance');
                const duration = _get(res, 'routes[0].duration');
                const legs = _get(res, 'routes[0].legs');
                return { geometry: geometry, path: path, distance: distance, duration: duration, legs: legs };
            }));
    }

    /**
     * Decode encrypted geometry path returned by OSMap and GMap
     * @param {type} str
     * @param {type} precision
     * @returns {Array|_decodePath.coordinates}
     */
    _decodePath(str: any, precision: number = 5) {
        let index = 0;
        let lat = 0;
        let lng = 0;
        const coordinates = [];
        let shift = 0;
        let result = 0;
        let byte = undefined;
        let latitudeChange;
        let longitudeChange;
        const factor = Math.pow(10, precision || 5);

        /* tslint:disable:no-bitwise */
        // bitwise codes must be fixed with extra care
        while (index < str.length) { // reset shift, result, and byte
            byte = undefined;
            shift = 0;
            result = 0;
            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            latitudeChange = ((result & 1) ? ~(result >> 1) : (result >> 1));
            shift = result = 0;
            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);
            longitudeChange = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += latitudeChange;
            lng += longitudeChange;
            coordinates.push({ lat: lat / factor, lng: lng / factor });
        }
        return coordinates;
    }

}
