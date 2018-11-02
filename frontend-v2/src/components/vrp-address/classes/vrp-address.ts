
export class VrpAddress {
    postal: string = '';
    address: string = '';
    lat?: number = 0;
    lng?: number = 0;

    set(v) {
        this.lat = parseFloat(this._getLat(v));
        this.lng = parseFloat(this._getLng(v));
        this.postal = this._getPostal(v);
        this.address = this._getAddress(v);
    }

    assignTo(v) {
        this._set(v, ['lat', 'Lat'], this.lat);
        this._set(v, ['lon', 'lng', 'Lng'], this.lng);
        this._set(v, ['postal', 'Postal'], this.postal);
        this._set(v, ['address', 'Address'], this.address);
    }

    toString(): string {
        if (this.address) {
            return this.address;
        } else if (this.postal) {
            return `Postal: ${this.postal}`;
        } else if (this.lat && this.lng) {
            return '[' + this.lat + ',' + this.lng + ']';
        }
        return 'Undefined';
    }

    private _set(object, keys: string[], value) {
        for (const k of keys) {
            if (object[k] !== undefined) {
                object[k] = value;
                break;
            }
        }
    }

    private _getLat(v) {
        return v ? (v && (v.lat || v.Lat)) : 0;
    }

    private _getLng(v) {
        return v ? (v.lng || v.lon || v.Lng) : 0;
    }

    private _getPostal(v): any {
        return v ? (v.postal || v.Postal) : 0;
    }

    private _getAddress(v): any {
        return v ? (v.address || v.full_address || v.Address) : '';
    }
}
