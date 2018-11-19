import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { TdLoadingService } from '@covalent/core/loading';
import { finalize } from 'rxjs/operators';

import { VrpHttpCache } from '@app/vrp-common';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpDialogService } from '@components/vrp-dialog';

@Component({
    selector: 'vrp-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class VrpLoginComponent {

    f: FormGroup;
    submitted: boolean = false;

    constructor(
        private _router: Router,
        private _loading: TdLoadingService,
        private _authentication: VrpAuthenticationService,
        private _dialog: VrpDialogService,
    ) {
        const username = new FormControl('', [Validators.required]);
        const password = new FormControl('', [Validators.required]);
        this.f = new FormGroup({ username, password });
    }

    login(f: any, isValid: boolean) {
        if (isValid) {
            this.submitted = true;
            this._loading.register('vrp-login.load');
            this._authentication.login(f.username, f.password)
                .pipe(finalize(() => this._loading.resolve('vrp-login.load')))
                .subscribe(() => {
                    this._afterSuccessLogin();
                }, (err) => {
                    this._dialog.errorResponse(err);
                    this.submitted = false;
                });
        }
    }

    private _afterSuccessLogin() {
        VrpHttpCache.clearCache(); // clear cache of http when login
        console.log('VrpLoginComponent -> _afterSuccessLogin -> user', this._authentication.user);
        if (this._authentication.isDriver()) {
            this._dialog.alert('Drivers are not authorized to use Planning page');
        } else {
            this._router.navigate(this._authentication.getDefaultUrlSegment());
        }
    }
}
