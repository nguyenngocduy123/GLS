import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
    selector: 'vrp-not-found',
    templateUrl: './vrp-not-found.component.html',
    styleUrls: ['./vrp-not-found.component.scss'],
})
export class VrpNotFoundComponent {

    constructor(
        private _location: Location,
    ) { }

    goBack() {
        this._location.back();
    }
}
