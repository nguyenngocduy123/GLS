import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'vrp-vehicle-capacity',
    templateUrl: './vrp-vehicle-capacity.component.html',
    styleUrls: ['./vrp-vehicle-capacity.component.scss'],
})
export class VrpVehicleCapacityComponent {
    _capacity: Number[] = [];

    @Input() items: string[];
    @Input() set capacity(values: Number[]) {
        if (values) {
            this._capacity = values;
        }
    }

    @Output() capacityChange: EventEmitter<Number[]> = new EventEmitter<Number[]>();

    constructor() { }

    onChange() {
        // emit as a new array so that angular can detect change
        this.capacityChange.emit([...this._capacity]);
    }
}
