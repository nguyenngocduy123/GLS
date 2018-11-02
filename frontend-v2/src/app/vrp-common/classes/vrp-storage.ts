export class VrpStorage {

    private _cache = [];

    constructor(
        private _name: string,
        private _maxCacheSize: number = 1000,
    ) {
        const storagedData = localStorage.getItem(this._name);
        if (storagedData) {
            try {
                this._cache = JSON.parse(storagedData);
            } catch (err) {
                console.error(`VrpStorage - localStorage - ${this._name} invalid`);
                localStorage.removeItem(this._name);
            }
        }
    }

    unshift(data) {
        if (this._cache.length >= this._maxCacheSize) {
            this._cache.shift(); // remove oldest items if cache size exceeds the limit
        }
        this._cache.unshift(data);
        this.save();
    }

    push(data) {
        if (this._cache.length >= this._maxCacheSize) {
            this._cache.shift(); // remove oldest items if cache size exceeds the limit
        }
        this._cache.push(data);
        this.save();
    }

    set(data) {
        this._cache = data;
        this.save();
    }

    get(): any[] {
        return this._cache;
    }

    save() {
        localStorage.setItem(this._name, JSON.stringify(this._cache)); // save to local storage
    }
}
