import { AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { timer } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { switchMap, map } from 'rxjs/operators';
import isSameDay from 'date-fns/is_same_day';
import isAfter from 'date-fns/is_after';

import { VrpGeocodeService } from '@app/vrp-common/services/geocode.service';

export function isLatLngValid(lat: number, lng: number): boolean {
    return !isNaN(lat) && (-90 < lat) && (lat < 90)
        && !isNaN(lng) && (-180 < lng) && (lng < 180);
}

export function getLatLonFromGeocodingResponse(postalStr: string, res): { lat: number, lon: number } {
    if (res && res.length > 0) {
        const postalResult = res.find((s) => s.postal === postalStr);
        if (postalResult) {
            const _coord: any = {
                lat: postalResult['user-lat'] || postalResult['onemap-lat'] || postalResult['sdmap-lat'],
                lon: postalResult['user-lon'] || postalResult['onemap-lon'] || postalResult['sdmap-lon'],
            };
            if (isLatLngValid(_coord.lat, _coord.lon)) {
                return _coord;
            }
        }
    }
    return undefined;
}

export function isLatValidInSingapore(lat) {
    const isWithinSingapore = !isNaN(lat) && (lat > 1.206622 && lat < 1.481204); // is in Singapore?
    return isWithinSingapore;
}

export function isLngValidInSingapore(lng) {
    const isWithinSingapore = !isNaN(lng) && (lng > 103.580887 && lng < 104.053299); // is in Singapore?
    return isWithinSingapore;
}

export interface ICallbackPostalFn {
    (res: { lat: number, lon: number }): void;
}

export class VrpValidators {
    static LatInSingapore() {
        return (control: AbstractControl) => {
            return isLatValidInSingapore(control.value) ? undefined : { invalid: true };
        };
    }

    static LngInSingapore() {
        return (control: AbstractControl) => {
            return isLngValidInSingapore(control.value) ? undefined : { invalid: true };
        };
    }

    static endTimeWindowValidator(startTimeWindow: AbstractControl) {
        return (control: AbstractControl) => {
            return isAfter(control.value, startTimeWindow.value) ? undefined : { lateThanStartTime: true };
        };
    }

    static startTimeWindowValidator(endTimeWindow: AbstractControl) {
        return (control: AbstractControl) => {
            return isAfter(endTimeWindow.value, control.value) ? undefined : { lateThanStartTime: true };
        };
    }

    static timeWindowValidator(timeWindow: AbstractControl) {
        return (control: AbstractControl) => {
            return isSameDay(control.value, timeWindow.value) ? undefined : { differentDays: true };
        };
    }

    static postalExistValidator(geoCode: VrpGeocodeService, done: ICallbackPostalFn): AsyncValidatorFn {
        return (control: AbstractControl): Observable<ValidationErrors> => {
            const postalStr = control.value;
            return timer(1000).pipe(switchMap(() => {
                return geoCode.searchAddress(postalStr).pipe((map((res) => {
                    const _coord = getLatLonFromGeocodingResponse(postalStr, res);
                    done(_coord);
                    return _coord ? undefined : { nonexistence: true };
                })));
            }));
        };

        // return (control: AbstractControl): Observable<ValidationErrors> => {
        //     const postalStr = control.value;
        //     if (postalStr && postalStr.length === 6) {
        //         return geoCode.searchAddress(postalStr).pipe((map((res) => {
        //             const _coord = _getLatLonFromResponse(postalStr, res);
        //             done(_coord);
        //             return _coord ? undefined : { nonexistence: true };
        //         })));
        //     } else {
        //         return of(undefined);
        //     }
        // };
    }

    static arrayNotEmpty() {
        return (control: AbstractControl) => {
            return Array.isArray(control.value) && control.value.length >= 1 ? undefined : { arrayNotEmpty: true };
        };
    }
}
