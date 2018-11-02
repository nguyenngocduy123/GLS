/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

export class Item {
    private _Id: string;
    private _Weight: number;
    private _Description: string;

    constructor(init?: Partial<Item>) {
        Object.assign(this, init);
    }

    get Id(): string { return this._Id; }
    set Id(id) { this._Id = id; }

    get Weight(): number { return this._Weight; }
    set Weight(weight) { this._Weight = weight; }

    get Description(): string { return this._Description; }
    set Description(description) { this._Description = description; }
}
