import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { shareReplay } from 'rxjs/operators';
import 'rxjs/add/operator/debounceTime';
import { get as _get } from 'lodash-es';

import { VrpUserGroupRestService, VrpGeocodeService, VrpValidators } from '@app/vrp-common';
import { ID_REGEX_PATTERN, POSTAL_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';
import { PlannerRestService, SqlTableNames } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { PLATE_NUMBER_MAXLENGTH, PLATENUMBER_REGEX_PATTERN } from '@app/planner/planner.config';

@Component({
    selector: 'vrp-planner-vehicle-detail-dialog',
    templateUrl: './planner-vehicle-detail-dialog.component.html',
    styleUrls: ['./planner-vehicle-detail-dialog.component.scss'],
})
export class PlannerVehicleDetailDialogComponent implements OnInit, OnDestroy {

    private _subcriptions: any[] = [];

    createNew: boolean = true;
    isPowerPlanner: boolean = false;
    f: FormGroup;

    readonly plateNumberMaxLength: number = PLATE_NUMBER_MAXLENGTH;

    allVehicleTypes: any = [];
    allUserGroups: any = [];
    enabledDrivers: any = [];
    filteredPostals: any[] = [];
    _coords = {};
    vehicle: any;

    constructor(
        private _dialogRef: MatDialogRef<PlannerVehicleDetailDialogComponent>,
        private _plannerRest: PlannerRestService,
        private _geocode: VrpGeocodeService,
        private _userGroupRest: VrpUserGroupRestService,
        private _toast: VrpToastService,
        private _authentication: VrpAuthenticationService,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        console.log('PlannerVehicleDetailDialogComponent -> constructor -> this.data.driverUsers', this.data.driverUsers);
        // only display drivers that are not disabled
        this.enabledDrivers = this.data.driverUsers.filter((d) => !d.disabled);

        // prepare form control
        this.f = new FormGroup({
            Id: new FormControl('VehicleA', [Validators.required, Validators.pattern(ID_REGEX_PATTERN)]),
            VehicleTypeId: new FormControl(undefined, [Validators.required]),
            PlateNumber: new FormControl('XXXXXX', [Validators.pattern(PLATENUMBER_REGEX_PATTERN)]),
            StartTime: new FormControl('08:00'),
            EndTime: new FormControl('20:00'),
            DriverUsername: new FormControl(undefined),
            ReturnToEndAddress: new FormControl(false),
            UserGroup: new FormControl(undefined),
            MaxNumJobs: new FormControl(1000, [Validators.min(1)]),
            StartAddressPostal: new FormControl('', [
                Validators.required, Validators.minLength(6), Validators.pattern(POSTAL_REGEX_PATTERN)],
                [VrpValidators.postalExistValidator(this._geocode, (res) => this._setCoords('Start', res))], // async validators
            ),
            EndAddressPostal: new FormControl('', [
                Validators.required, Validators.minLength(6), Validators.pattern(POSTAL_REGEX_PATTERN)],
                [VrpValidators.postalExistValidator(this._geocode, (res) => this._setCoords('End', res))], // async validators
            ),
        });

        if (data.value) {
            this.createNew = false;
            this.f.patchValue(data.value);

            [`StartAddressLat`, 'StartAddressLng', `EndAddressLat`, 'EndAddressLng'].forEach((f) => {
                this._coords[f] = data.value[f];
            });
        }

        this.vehicle = data.value;
        this.isPowerPlanner = data.isPowerPlanner;
        this.allVehicleTypes = this._plannerRest.getVehicleTypes().pipe(shareReplay(1));
        this.allUserGroups = this._userGroupRest.getAllUserGroups().pipe(shareReplay(1));
    }

    ngOnInit() {
        this._subcriptions = [
            this.f.controls.StartAddressPostal.valueChanges.debounceTime(500).subscribe((s) => this._searchPostal(s)),
            this.f.controls.EndAddressPostal.valueChanges.debounceTime(500).subscribe((s) => this._searchPostal(s)),
        ];
    }

    ngOnDestroy(): void {
        this._subcriptions.forEach((s) => s.unsubscribe());
    }

    save(value, valid: boolean) {
        const tName: SqlTableNames = 'Vehicle';
        if (valid) {
            if (!value.DriverUsername) {
                /* tslint:disable:no-null-keyword */
                value.DriverUsername = null; // important, must use null to overwrite server values
            }

            if (!value.UserGroup) {
                /* tslint:disable:no-null-keyword */
                value.UserGroup = null; // important, must use null to overwrite server values
            }

            ['StartAddressLat', 'StartAddressLng', 'EndAddressLat', 'EndAddressLng'].forEach((f) => {
                if (this._coords[f]) {
                    value[f] = this._coords[f];
                }
            });

            if (!this.isPowerPlanner) {
                value.UserGroup = this._authentication.getUserGroup();
            }

            if (this.createNew) {
                this._plannerRest.create(value, tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Create Error', err));
            } else {
                this._plannerRest.update(Object.assign({}, this.vehicle, value), tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Update Error', err));
            }
        }
    }

    private _searchPostal(postalStr: string) {
        this._geocode.searchAddress(postalStr).subscribe((res) => this.filteredPostals = res);
    }

    private _setCoords(initial: string, res) {
        this._coords[`${initial}AddressLat`] = _get(res, 'lat');
        this._coords[`${initial}AddressLng`] = _get(res, 'lon');
    }
}
