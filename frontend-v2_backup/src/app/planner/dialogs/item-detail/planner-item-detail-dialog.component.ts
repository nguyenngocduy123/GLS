import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { ID_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';
import { PlannerRestService, SqlTableNames } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-planner-item-detail-dialog',
    templateUrl: './planner-item-detail-dialog.component.html',
    styleUrls: ['./planner-item-detail-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerItemDetailDialogComponent {

    createNew: boolean = true;
    item: any;
    f: FormGroup;

    constructor(
        private _dialogRef: MatDialogRef<PlannerItemDetailDialogComponent>,
        private _plannerRest: PlannerRestService,
        private _toast: VrpToastService,
        @Inject(MAT_DIALOG_DATA) data: any,
    ) {
        // prepare form control
        this.f = new FormGroup({
            Id: new FormControl('ItemA', [
                Validators.required,
                Validators.pattern(ID_REGEX_PATTERN),
                this.checkIdExistence(data.allItemIds.map((i) => i.toUpperCase())),
            ]),
            Weight: new FormControl(10, [
                Validators.required,
                Validators.min(0.0001),
            ]),
            Description: new FormControl('Description', []),
        });

        if (data.value) {
            this.createNew = false;
            this.f.patchValue(data.value);
        }
        this.item = data.value;
    }

    save(value, valid: boolean) {
        if (valid) {
            const tName: SqlTableNames = 'Item';
            if (this.createNew) {
                this._plannerRest.create(value, tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Create Error', err));
            } else {
                this._plannerRest.update(Object.assign({}, this.item, value), tName).subscribe((res) => {
                    this._dialogRef.close();
                }, (err) => this._toast.shortAlert('Update Error', err));
            }
        }
    }

    private checkIdExistence(values: string[]) {
        return (c: FormControl) => (this.createNew && c.value && values.includes(c.value.toString().toUpperCase())) ? { 'existence': true } : undefined;
    }
}
