import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable({
    providedIn: 'root',
})
export class CookieExpiryService {
    sessionExpired: Subject<boolean> = new Subject(); // fire on cookie expiry

    constructor() { }

}
