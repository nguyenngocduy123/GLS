import { Observable } from 'rxjs/Observable';
import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, AsyncValidatorFn, AbstractControl } from '@angular/forms';
import { shareReplay, map } from 'rxjs/operators';

import { PlannerRestService, DuplicatesTableNames } from '@app/planner/services/planner-rest.service';
import { VrpUserGroupRestService } from '@app/vrp-common';
import { PRIORITY_LABELS } from '@app/planner/planner.config';
import { EMAIL_REGEX_PATTERN, PHONE_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-planner-delivery-master',
    templateUrl: './planner-delivery-master.component.html',
    styleUrls: ['./planner-delivery-master.component.scss'],
})
export class PlannerDeliveryMasterComponent implements OnInit {
    private _tableName: DuplicatesTableNames = 'order';
    @Input()
    set orderForm(val) {
        this.f = val;
    }

    @Input() allowToChangeId: boolean = true;
    @Input() readonly: boolean;

    allUserGroups;
    f: FormGroup;
    readonly priorityLabels: string[] = PRIORITY_LABELS.filter((e) => e.length > 0);

    constructor(
        private _userGroupRest: VrpUserGroupRestService,
        private _plannerRest: PlannerRestService,
    ) {
        this.allUserGroups = this._userGroupRest.getAllUserGroups().pipe(shareReplay(1));
    }

    static createForm(_j, isPowerPlanner: boolean): FormGroup {
        const newForm = new FormGroup({
            Id: new FormControl(undefined, [
                Validators.required,
            ]),
            CustomerName: new FormControl(undefined, []),
            CustomerPhone: new FormControl(undefined, [
                Validators.pattern(PHONE_REGEX_PATTERN),
            ]),
            CustomerEmail: new FormControl(undefined, [
                Validators.pattern(EMAIL_REGEX_PATTERN),
            ]),
            Priority: new FormControl(2),
            UserGroup: new FormControl({ value: undefined, disabled: !isPowerPlanner }, []),
            VehicleRestriction: new FormControl(undefined, []),
            VehicleId: new FormControl({ value: '', disabled: true }, []),
        });

        newForm.patchValue(_j);
        return newForm;
    }

    ngOnInit() {
        this.f.get('Id').setAsyncValidators(this._validateExistingId()); // since createForm static
    }

    private _validateExistingId(): AsyncValidatorFn {
        return (control: AbstractControl): any => {
            if (!control.value) {
                return Observable.of(undefined);
            }

            return this._plannerRest.checkForDuplicates([control.value], this._tableName).pipe(map((existingIds) => {
                if (this.allowToChangeId && existingIds.length > 0) {
                    return { existence: true };
                }
            }));
        };
    }
}
