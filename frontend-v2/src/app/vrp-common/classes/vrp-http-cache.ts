import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { remove as _remove } from 'lodash-es';

/**
 * Cache HTTP GET class
 */
export class VrpHttpCache {
    private static _maxCacheSize: number;
    private static _cache = [];

    static http;

    static maxCacheSize: number = 1000;

    static get(url: string, forceRefresh: boolean = false, tags: any = undefined): Observable<any> {
        const record = VrpHttpCache._cache.find((d) => d.url === url);

        if (record && !forceRefresh) {
            console.log('VrpHttpCache -> get -> FROM CACHE', record);
            return of(record.data);

        } else {
            console.log('VrpHttpCache -> get', url);
            return this.http.get(url).pipe(map(
                (res: any) => {
                    if (res) {
                        this._storeData(url, res, tags);
                    }
                    return res;
                }));
        }
    }

    static getCacheData(urlSubStr: string) {
        return VrpHttpCache._cache.find((d) => d.url.includes(urlSubStr));
    }

    /**
     * remove all cached values with url contain the input sub string
     * @param urlSubStr
     */
    static invalidateCache(urlSubStr: string) {
        return _remove(VrpHttpCache._cache, (d) => d.url.includes(urlSubStr));
    }

    static clearCache() {
        VrpHttpCache._cache = [];
    }

    /**
     * Push <url,data> into _cache object
     * @param url
     * @param data
     */
    private static _storeData(url: string, data, tags: any) {
        const record = VrpHttpCache._cache.find((d) => d.url === url);
        if (!record) {
            if (VrpHttpCache._cache.length >= VrpHttpCache._maxCacheSize) {
                VrpHttpCache._cache.shift(); // remove oldest items if cache size exceeds the limit
            }
            VrpHttpCache._cache.push(Object.assign({ url: url, data: data }, tags ? tags : {}));
        } else {
            record.data = data;
        }
    }
}
