import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-force-change-password',
    templateUrl: './force-change-password.component.html',
    styleUrls: ['./force-change-password.component.scss'],
})
export class VrpForceChangePasswordComponent {

    username: string;

    constructor(
        private _router: Router,
        private _authentication: VrpAuthenticationService,
        private _toast: VrpToastService,
    ) {
        this.username = this._authentication.getUserName();
    }

    submit(user) {
        console.log('VrpForceChangePasswordComponent -> submit -> user', user);
        if (user) {
            this._toast.shortAlert('USER_SETTING.PASSWORD_UPDATED_SUCCESS_MSG');
            this._router.navigate(this._authentication.getDefaultUrlSegment(true));
        } else {
            this._router.navigate(['login']);
        }
    }
}
