import { Component, Input } from '@angular/core';

import { PlannerRestService } from '@app/planner/services/planner-rest.service';

const EARTH_RADIUS_IN_METERS: number = 6371000;

function _toRadians(value: number): number {
    return value * Math.PI / 180;
}

function _getDistanceInMeters(coord1, coord2): number {
    const φ1 = _toRadians(coord1.lat);
    const φ2 = _toRadians(coord2.lat);
    const Δφ = _toRadians(coord2.lat - coord1.lat);
    const Δλ = _toRadians(coord2.lng - coord1.lng);
    const a = Math.pow(Math.sin(Δφ / 2), 2) + Math.cos(φ1) * Math.cos(φ2) * Math.pow(Math.sin(Δλ / 2), 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_IN_METERS * c;
}

@Component({
    selector: 'vrp-planner-driver-notes',
    templateUrl: './planner-driver-notes.component.html',
    styleUrls: ['./planner-driver-notes.component.scss'],
})
export class PlannerDriverNotesComponent {

    circleDistance: number;

    _job: any = {};

    @Input()
    get job() {
        return this._job;
    }

    set job(val) {
        this._job = val;
        if (this._job.Id) {
            if (this._job.NoteFromDriver) {
                const actualLocation = this._job.NoteFromDriver.find((note) => {
                    return note.key === 'ActualDeliveryLocation';
                });

                if (actualLocation) {
                    this.circleDistance = _getDistanceInMeters({ lat: this._job.Lat, lng: this._job.Lng }, actualLocation.value);
                }
            }

            if (!this._job.DeliveryNotePhoto) {
                this._plannerRest.getDeliveryNote(this._job.Id).subscribe((res) => {
                    this._job.DeliveryNotePhoto = res;
                }, (err) => console.error('Failed to get Delivery Note Photo', err));
            }
        }
    }

    constructor(
        private _plannerRest: PlannerRestService,
    ) { }
}
