import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { VrpGeocodeService } from '@app/vrp-common';
import { VrpAddress } from '@components/vrp-address/classes/vrp-address';

@Component({
    selector: 'vrp-address-form',
    templateUrl: './vrp-address-form.component.html',
    styleUrls: ['./vrp-address-form.component.scss'],
})
export class VrpAddressFormComponent implements OnInit {

    _address: VrpAddress = new VrpAddress();

    displayText: string = '';

    @Input() address;

    @Output() onClose: EventEmitter<VrpAddress> = new EventEmitter();

    constructor(
        private _geocodeService: VrpGeocodeService,
    ) { }

    ngOnInit() {
        this._address.set(this.address);
    }

    cancel() {
        this._address.set(this.address);
        this.onClose.emit(undefined);
    }

    save() {
        this._address.assignTo(this._address);
    }

    postalChanged(postal) {
        if (postal.length === 6) {
            this._geocodeService.geocode([postal]).subscribe((answer) => {
                if (answer[0]) {
                    this._address.lat = answer[0].lat;
                    this._address.lng = answer[0].lon || answer[0].lng;
                    console.log(answer);
                }
            });
        }
    }
}
