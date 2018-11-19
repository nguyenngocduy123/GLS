import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ngx-custom-validators';

import { VrpUserRestService } from '@app/vrp-common';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';

@Component({
    selector: 'vrp-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.scss'],
})
export class VrpChangePasswordComponent {

    @Output() onSubmit: EventEmitter<any> = new EventEmitter();

    f: FormGroup;
    passwordRequirementErrorMsg: string;

    constructor(
        private _authentication: VrpAuthenticationService,
        private _userRest: VrpUserRestService,
    ) {
        const currentPassword = new FormControl('', [Validators.required]);
        const newPassword = new FormControl('', [Validators.required]);
        const confirmPassword = new FormControl('', [Validators.required, CustomValidators.equalTo(newPassword)]);

        this.f = new FormGroup({ currentPassword, newPassword, confirmPassword });
    }

    cancel() {
        this.onSubmit.emit();
    }

    submit(values: any, valid: boolean) {
        if (valid && values) {
            this._userRest.updatePassword(values.currentPassword, values.newPassword).subscribe((user) => {
                this._authentication.saveUser(user);
                this.onSubmit.emit(user);
            }, (err) => {
                console.error(err.error);
                this.passwordRequirementErrorMsg = err.error;
            });
        }
    }
}
