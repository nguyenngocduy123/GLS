import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import 'rxjs/add/operator/debounceTime';

import { ID_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';
import { PlannerRestService, SqlTableNames } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-planner-vehicle-type-detail-dialog',
    templateUrl: './planner-vehicle-type-detail-dialog.component.html',
    styleUrls: ['./planner-vehicle-type-detail-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerVehicleTypeDetailDialogComponent {

    createNew: boolean = true;
    vehicleType: any;
    f: FormGroup;

    constructor(
        private _dialogRef: MatDialogRef<PlannerVehicleTypeDetailDialogComponent>,
        private _plannerRest: PlannerRestService,
        private _toast: VrpToastService,
        @Inject(MAT_DIALOG_DATA) data: any,
    ) {
        // prepare form control
        this.f = new FormGroup({
            Name: new FormControl('TypeA', [
                Validators.required,
                Validators.pattern(ID_REGEX_PATTERN),
                this.checkIdExistence(data.allVehicleTypeNames.map((i) => i.toUpperCase())),
            ]),
            Capacity: new FormControl(1000, [
                Validators.min(0.0001),
            ]),
            FixedCost: new FormControl(100, [
                Validators.min(0),
            ]),
            DistanceCost: new FormControl(0.00036, [ // actual input is 0.0001 to engine
                Validators.min(0),
            ]),
            TravelTimeCost: new FormControl(6.12, [ // actual input is 0.0017 to engine
                Validators.min(0),
            ]),
            WaitingTimeCost: new FormControl(6.12, [ // actual input is 0.0017 to engine
                Validators.min(0),
            ]),
        });

        if (data.value) {
            this.createNew = false;
            this.f.patchValue(data.value);
        }
        this.vehicleType = data.value;
    }

    save(value, valid: boolean) {
        if (valid) {
            const tName: SqlTableNames = 'VehicleType';
            if (this.createNew) {
                this._plannerRest.create(value, tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Create Error', err));
            } else {
                this._plannerRest.update(Object.assign({}, this.vehicleType, value), tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Update Error', err));
            }
        }
    }

    private checkIdExistence(values: string[]) {
        return (c: FormControl) => (this.createNew && c.value && values.includes(c.value.toString().toUpperCase())) ? { 'existence': true } : undefined;
    }
}
