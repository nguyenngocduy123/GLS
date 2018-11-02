import { Injectable } from '@angular/core';

import { VrpStorage } from '@app/vrp-common/classes/vrp-storage';

@Injectable({ providedIn: 'root' })
export class VrpLocalStorageService {

    private _storage: any = {};

    constructor() { }

    get(key: string, maxCacheSize?: number) {
        if (!this._storage[key]) {
            this._storage[key] = new VrpStorage(key, maxCacheSize);
        }
        return this._storage[key];
    }

    unshift(key, data) {
        this._storage[key].unshift();
    }
}
