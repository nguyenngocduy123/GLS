import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { shareReplay } from 'rxjs/operators';

import { VrpUserGroupRestService } from '@app/vrp-common';
import { EMAIL_REGEX_PATTERN, USER_ROLE_OPTIONS, USERNAME_REGEX_PATTERN, NRIC_REGEX_PATTERN, PHONE_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-edit-user-dialog',
    templateUrl: './user-detail-dialog.component.html',
    styleUrls: ['./user-detail-dialog.component.scss'],
})
export class VrpUserDetailDialogComponent {

    title: string;

    readonly userRoleOptions: any[] = USER_ROLE_OPTIONS;

    createNew: boolean = true;
    isDriver: boolean = false;

    allUsernames: string[];
    allUserGroups: any;

    f: FormGroup;

    constructor(
        private _dialogRef: MatDialogRef<VrpUserDetailDialogComponent>,
        private _userGroupRest: VrpUserGroupRestService,
        @Inject(MAT_DIALOG_DATA) data: any,
    ) {
        let allUsersExceptMe: any[] = data.allUsers.filter((u) => u);

        if (data.user) {
            this.createNew = false;
            this.isDriver = data.user.role === 'driver';
            allUsersExceptMe = allUsersExceptMe.filter((u) => u.username !== data.user.username);
        }

        this.allUsernames = allUsersExceptMe.map((u) => u.username.toUpperCase()).filter((s) => s);

        this.allUserGroups = this._userGroupRest.getAllUserGroups().pipe(shareReplay(1));

        // prepare form control

        this.f = new FormGroup({
            fullname: new FormControl('', [Validators.required]),
            email: new FormControl('', [Validators.required, Validators.pattern(EMAIL_REGEX_PATTERN)]),
            username: new FormControl('', [Validators.required, Validators.pattern(USERNAME_REGEX_PATTERN), this.checkExistence(this.allUsernames)]),
            usergroup: new FormControl(undefined, []),
            disabled: new FormControl(false),
            role: new FormControl('default', [Validators.required]),
            nric: new FormControl(undefined, []),
            phone: new FormControl(undefined, []),
            note: new FormControl(undefined, []),
        });

        if (!this.createNew) {
            this.f.patchValue(data.user);
        }

        this.f.get('role').valueChanges.subscribe(
            (role: string) => {
                this.isDriver = role === 'driver';
                this.f.get('nric').setValidators((this.isDriver) ? [Validators.required, Validators.pattern(NRIC_REGEX_PATTERN)] : []);
                this.f.get('nric').updateValueAndValidity();

                this.f.get('phone').setValidators((this.isDriver) ? [Validators.required, Validators.pattern(PHONE_REGEX_PATTERN)] : []);
                this.f.get('phone').updateValueAndValidity();
            },
        );
    }

    save(value, valid: boolean) {
        if (valid) {
            if (!value.usergroup) {
                /* tslint:disable:no-null-keyword */
                value.usergroup = null; // important, must use null to overwrite server values
            }
            this._dialogRef.close(value);
        }
    }

    private checkExistence(values) {
        return (c: FormControl) => (c.value && values.includes(c.value.toString().toUpperCase())) ? { 'existence': true } : undefined;
    }
}
