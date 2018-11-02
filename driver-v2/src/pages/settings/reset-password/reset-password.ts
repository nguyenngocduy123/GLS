/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams, Platform } from 'ionic-angular';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';

import { Globals } from '../../../globals';
import { AuthProvider } from '../../../providers/user/auth';
import { LoadingProvider } from '../../../providers/loading/loading';
import { NotificationProvider } from '../../../providers/notification/notification';

import { PasswordValidator } from '../reset-password/validators/confirm-password.validator';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-reset-password',
    templateUrl: 'reset-password.html',
})
export class ResetPasswordPage extends NavigationProvider {
    private btnBackEvent: Function;

    isModal: boolean = false;
    resetPwForm: FormGroup;
    fields = {
        oldPassword: {
            name: 'oldPw',
            message: {
                required: 'Current password is required.',
            },
        },
        newPassword: {
            name: 'newPw',
            message: {
                required: 'Password is required.',
            },
        },
        confirmPassword: {
            name: 'confirmPw',
            message: {
                required: 'Confirm password is required.',
            },
        },
        matchPassword: {
            name: 'matPsw',
            message: {
                areEqual: 'Password mismatch',
            },
        },
    };

    constructor(
        public auth: AuthProvider,
        public formBuilder: FormBuilder,
        public loading: LoadingProvider,
        public navParams: NavParams,
        public notify: NotificationProvider,
        public platform: Platform,
        public viewCtrl: ViewController,
    ) {
        super({ platform: platform });

        this.resetPwForm = this.formBuilder.group({
            [this.fields.oldPassword.name]: new FormControl('', Validators.required),
            [this.fields.matchPassword.name]: new FormGroup({
                [this.fields.newPassword.name]: new FormControl('', Validators.required),
                [this.fields.confirmPassword.name]: new FormControl('', Validators.required),
            }, (formGroup: FormGroup) => {
                return PasswordValidator.areEqual(formGroup);
            }),
        });
    }

    ionViewCanEnter() {
        if (Globals.features.showChangePassword === false) { // do not enter page if feature is not enabled
            return false;
        }
        this.isModal = this.navParams.get('isModal');
    }

    ionViewWillEnter() {
        if (this.isModal) {
            this.btnBackEvent = this.overwriteBackBtnEvent();
        }
    }

    ionViewDidLeave() {
        if (this.isModal) {
            this.btnBackEvent();
        }
    }

    btnConfirm() {
        if (this.resetPwForm.invalid === true) {
            this.notify.error('Please resolve all validation errors.');
            return;
        }

        const oldPw = this.resetPwForm.get(this.fields.oldPassword.name).value;
        const newPw = this.resetPwForm.get(this.fields.matchPassword.name).get(this.fields.newPassword.name).value;

        const loader = this.loading.show();
        this.auth.changePassword(oldPw, newPw)
            .then(() => {
                loader.dismiss();

                this.notify.success('Password reset successfully!');
                this.auth.forceChangePassword = false; // stop change password dialog from opening again
                if (this.isModal === true) {
                    this.viewCtrl.dismiss(); // close dialog if was opened as dialog
                }
                this.resetPwForm.reset(); // clear the form
            })
            .catch((err) => {
                loader.dismiss();

                this.notify.error(err);
            });
    }
}
