import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { shareReplay } from 'rxjs/operators';

import { VrpUserGroupRestService } from '@app/vrp-common';
import { PRIORITY_LABELS } from '@app/planner/planner.config';
import { EMAIL_REGEX_PATTERN, PHONE_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-planner-delivery-master',
    templateUrl: './planner-delivery-master.component.html',
    styleUrls: ['./planner-delivery-master.component.scss'],
})
export class PlannerDeliveryMasterComponent {

    @Input() allowToChangeId: boolean = true;

    allUserGroups;

    readonly priorityLabels: string[] = PRIORITY_LABELS.filter((e) => e.length > 0);

    @Input() readonly: boolean;

    @Input()
    set orderForm(val) {
        this.f = val;
    }

    f: FormGroup;

    constructor(
        private _userGroupRest: VrpUserGroupRestService,
    ) {
        this.allUserGroups = this._userGroupRest.getAllUserGroups().pipe(shareReplay(1));
    }

    static createForm(_j, isPowerPlanner: boolean): FormGroup {
        const newForm = new FormGroup({
            Id: new FormControl(undefined, [Validators.required]),
            CustomerName: new FormControl(undefined, []),
            CustomerPhone: new FormControl(undefined, [Validators.pattern(PHONE_REGEX_PATTERN)]),
            CustomerEmail: new FormControl(undefined, [Validators.pattern(EMAIL_REGEX_PATTERN)]),
            Priority: new FormControl(2),
            UserGroup: new FormControl({ value: undefined, disabled: !isPowerPlanner }, []),
            VehicleRestriction: new FormControl(undefined, []),
            VehicleId: new FormControl({ value: '', disabled: true }, []),
        });

        newForm.patchValue(_j);
        return newForm;
    }
}
