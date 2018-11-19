/**
 * @fileoverview This component is meant for activity `address` (e.g. `problem.service.address`), NOT `problem.addresses`
 */

export class VrpAddress {
    postal: string = '';
    full_address: string = ''; // tslint:disable-line
    lat?: number = 0;
    lon?: number = 0;

    set(v) {
        this.lat = parseFloat(this._getLat(v));
        this.lon = parseFloat(this._getLon(v));
        this.postal = this._getPostal(v);
        this.full_address = this._getAddress(v);
    }

    assignTo(v) {
        this._set(v, ['lat', 'Lat'], this.lat);
        this._set(v, ['lon', 'lng', 'Lng'], this.lon);
        this._set(v, ['postal', 'Postal'], this.postal);
        this._set(v, ['address', 'full_address', 'Address'], this.full_address);
    }

    toString(): string {
        if (this.full_address) {
            return this.full_address;
        } else if (this.postal) {
            return `Postal: ${this.postal}`;
        } else if (this.lat && this.lon) {
            return '[' + this.lat + ',' + this.lon + ']';
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

    private _getLon(v) {
        return v ? (v.lng || v.lon || v.Lng) : 0;
    }

    private _getPostal(v): any {
        return v ? (v.postal || v.Postal) : 0;
    }

    private _getAddress(v): any {
        return v ? (v.address || v.full_address || v.Address) : '';
    }
}
