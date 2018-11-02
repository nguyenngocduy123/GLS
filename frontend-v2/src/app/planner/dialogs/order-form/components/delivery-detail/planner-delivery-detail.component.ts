import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import * as format from 'date-fns/format';
import { get as _get } from 'lodash-es';
import * as isSameday from 'date-fns/is_same_day';

import { VrpGeocodeService } from '@app/vrp-common';
import { STATUS_LABELS } from '@app/planner/planner.config';
import { getLatLonFromGeocodingResponse, VrpValidators } from '@app/vrp-common/classes/vrp-validators';
import { EMAIL_REGEX_PATTERN, POSTAL_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-planner-delivery-detail',
    templateUrl: './planner-delivery-detail.component.html',
    styleUrls: ['./planner-delivery-detail.component.scss'],
})
export class PlannerDeliveryDetailComponent implements OnInit, OnDestroy {

    private _subcriptions: any[] = [];

    filteredPostals: any[] = [];

    readonly statusLabels: string[] = [...STATUS_LABELS];

    @Input()
    set jobForm(val) {
        this.f = val;
    }

    f: FormGroup; // for for delivery detail

    @Input() readonly: boolean = true;
    @Input() allowDeleteJob: boolean = true;
    @Input() allowChangeJobType: boolean = true;
    @Input() originalJob;

    @Output() jobDelete: EventEmitter<boolean> = new EventEmitter();

    selectedIndex: number = 0;

    constructor(
        private _geocode: VrpGeocodeService,
    ) { }

    static createForm(val): FormGroup {
        const _startTimeWindow = new FormControl(undefined, [Validators.required]);

        const newForm = new FormGroup({
            Id: new FormControl(undefined, []),
            ContactName: new FormControl(undefined, []),
            ContactPhone: new FormControl(undefined, []),
            ContactEmail: new FormControl(undefined, [
                Validators.pattern(EMAIL_REGEX_PATTERN),
            ]),
            JobType: new FormControl('PICKUP', []),
            JobSequence: new FormControl(0, []),
            ServiceTime: new FormControl(10, [
                Validators.required,
                Validators.min(0.0001),
            ]),
            Address: new FormControl(undefined, []),
            Postal: new FormControl('', [
                Validators.required,
                Validators.minLength(6),
                Validators.pattern(POSTAL_REGEX_PATTERN),
            ], ),
            Lat: new FormControl(undefined, [
                Validators.required,
                VrpValidators.LatInSingapore,
            ]),
            Lng: new FormControl(undefined, [
                Validators.required,
                VrpValidators.LngInSingapore,
            ]),
            StartTimeWindow: _startTimeWindow,
            EndTimeWindow: new FormControl(undefined, [
                Validators.required,
                VrpValidators.endTimeWindowValidator(_startTimeWindow),
                VrpValidators.timeWindowValidator(_startTimeWindow),
            ]),
            VerificationCode: new FormControl(undefined, []),
            NoteFromPlanner: new FormControl([], []),
            DeliveryItems: new FormControl([], [
                VrpValidators.arrayNotEmpty(),
            ]),
            ActualDeliveryTime: new FormControl({ value: undefined, disabled: true }, []),
            Status: new FormControl({ value: undefined, disabled: true }, []),
        });

        const valueToPatch = Object.assign({}, val, {
            VerificationCode: _get(val, 'VerificationCode.Code'),
            StartTimeWindow: format(val.StartTimeWindow, 'YYYY-MM-DDTHH:mm'),
            EndTimeWindow: format(val.EndTimeWindow, 'YYYY-MM-DDTHH:mm'),
            ActualDeliveryTime: val.ActualDeliveryTime ? format(val.ActualDeliveryTime, 'YYYY-MM-DDTHH:mm') : undefined,
        });

        newForm.patchValue(valueToPatch);
        return newForm;
    }

    ngOnInit() {
        const endTimeControl = this.f.get('EndTimeWindow');
        const startTimeControl = this.f.get('StartTimeWindow');
        const jobsControl = this.f.parent.controls;
        startTimeControl.setValidators([Validators.required, VrpValidators.startTimeWindowValidator(endTimeControl), VrpValidators.timeWindowValidator(endTimeControl)]);

        this._subcriptions = [
            this.f.get('Postal').valueChanges.debounceTime(500).subscribe((s) => {
                if (s.length >= 4) { // at least typed 3 characters
                    this._geocode.searchAddress(s).subscribe((res) => {
                        this.filteredPostals = res;
                        if (this.filteredPostals.length === 0) {
                            this.f.get('Postal').setErrors({ nonexistence: true });
                        }
                        if (s.length === 6) {
                            this.setCoords(s);
                        }
                    }, (err) => {
                        this.f.get('Postal').setErrors({ serverError: true });
                    });
                }
            }),
            startTimeControl.valueChanges.debounceTime(500).subscribe((s) => {
                endTimeControl.updateValueAndValidity();
                this._validateJobsDate(jobsControl, startTimeControl);
            }),
            endTimeControl.valueChanges.debounceTime(500).subscribe((s) => {
                startTimeControl.updateValueAndValidity();
                this._validateJobsDate(jobsControl, endTimeControl);
            }),
        ];
    }

    ngOnDestroy(): void {
        this._subcriptions.forEach((s) => s.unsubscribe());
    }

    sendDeleteJobRequest() {
        this.jobDelete.emit(true);
    }

    generateVerificationCode() {
        const c = this.f.get('VerificationCode');
        if (c) {
            c.patchValue(Math.floor(Math.random() * 89999 + 10000));
            c.markAsDirty();
        }
    }

    setCoords(s: string) {
        const coords = getLatLonFromGeocodingResponse(s, this.filteredPostals);
        console.log('setCoords -> coords', s, coords, this.filteredPostals);
        this.f.get('Lat').patchValue(coords && coords.lat);
        this.f.get('Lng').patchValue(coords && coords.lon);
    }

    private _validateJobsDate(controls: any, dateControl) {
        if (controls.length > 1 && (!isSameday(controls[0].controls.StartTimeWindow.value, controls[1].controls.StartTimeWindow.value) || !isSameday(controls[0].controls.EndTimeWindow.value, controls[1].controls.EndTimeWindow.value))) {
            dateControl.setErrors({ differentJobDays: true });
        }
    }
}
