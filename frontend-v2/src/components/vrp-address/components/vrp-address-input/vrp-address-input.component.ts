import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { VrpAddress } from '@components/vrp-address/classes/vrp-address';
import { VrpGeocodeService } from '@app/vrp-common';

@Component({
    selector: 'vrp-address-input',
    templateUrl: './vrp-address-input.component.html',
    styleUrls: ['./vrp-address-input.component.scss'],
})
export class VrpAddressInputComponent implements OnInit {

    _address: VrpAddress = new VrpAddress();

    displayText: string = '';

    @Input() label: string;

    @Input() address;

    @Output() onClose: EventEmitter<VrpAddress> = new EventEmitter();

    constructor(
        private _geocode: VrpGeocodeService,
    ) { }

    ngOnInit() {
        this._address.set(this.address);
        this.displayText = this._address.toString();
    }

    cancel() {
        this._address.set(this.address);
        this.onClose.emit(undefined);
    }

    save() {
        this._address.assignTo(this._address);
        this.displayText = this._address.toString();
        this.onClose.emit(this._address);
    }

    postalChanged(postal) {
        if (postal.length === 6) {
            this._geocode.geocode([postal]).subscribe((answer) => {
                if (answer[0]) {
                    this._address.lat = answer[0].lat;
                    this._address.lng = answer[0].lon || answer[0].lng;
                    console.log(answer);
                }
            });
        }
    }

    stopPropagation(event: any) {
        event.stopPropagation();
    }
}
