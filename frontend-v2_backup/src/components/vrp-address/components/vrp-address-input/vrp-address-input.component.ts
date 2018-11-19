import { Component, EventEmitter, Input, Output } from '@angular/core';

import { VrpAddress } from '@components/vrp-address/classes/vrp-address';
import { VrpGeocodeService } from '@app/vrp-common';

@Component({
    selector: 'vrp-address-input',
    templateUrl: './vrp-address-input.component.html',
    styleUrls: ['./vrp-address-input.component.scss'],
})
export class VrpAddressInputComponent {

    _address: VrpAddress = new VrpAddress();

    displayText: string = '';

    @Input() label: string;

    @Input() set address(values: VrpAddress) {
        this._address.set(values);
        this.displayText = this._address.toString();
    }

    @Output() addressChange: EventEmitter<VrpAddress> = new EventEmitter<VrpAddress>();

    constructor(
        private _geocode: VrpGeocodeService,
    ) { }

    cancel() {
        this._address.set(this.address);
    }

    save() {
        this._address.assignTo(this._address);
        this.displayText = this._address.toString();
        this.addressChange.emit(this._address);
    }

    postalChanged(postal) {
        if (postal.length === 6) {
            this._geocode.geocode([postal]).subscribe((answer) => {
                if (answer[0]) {
                    this._address.lat = answer[0].lat;
                    this._address.lon = answer[0].lon || answer[0].lng;
                    console.log('TCL: VrpAddressInputComponent -> postalChanged -> answer', answer);
                }
            });
        }
    }

    stopPropagation(event: any) {
        event.stopPropagation();
    }
}
