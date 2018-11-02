/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';

import { Globals } from '../../../globals';
import { AuthProvider } from '../../../providers/user/auth';
import { LoadingProvider } from '../../../providers/loading/loading';
import { NotificationProvider } from '../../../providers/notification/notification';
import { UserDriverProvider } from '../../../providers/user/user-driver';

@IonicPage()
@Component({
    selector: 'page-change-driver-details',
    templateUrl: 'change-driver-details.html',
})
export class ChangeDriverDetailsPage {
    isModal: boolean = false;
    newPlateNumber: string;
    vehicleId: string;

    driverDetailsForm: FormGroup;
    fields = {
        newPlateNumber: {
            name: 'newPlateNumber',
            message: {
                required: 'PlateNumber is required.',
                pattern: 'PlateNumber must be within 10 chars and can contain letters, numbers and dashes only.',
            },
        },
    };

    constructor(
        public auth: AuthProvider,
        public driver: UserDriverProvider,
        public formBuilder: FormBuilder,
        public loading: LoadingProvider,
        public navParams: NavParams,
        public notify: NotificationProvider,
        public viewCtrl: ViewController,
    ) {
        this.driverDetailsForm = this.formBuilder.group({
            [this.fields.newPlateNumber.name]: new FormControl('', Validators.compose([
                Validators.pattern('^(?=^.{1,10}$)[A-Za-z0-9-]+$'),
                Validators.required,
            ])),
        });
    }

    ionViewCanEnter() {
        if (Globals.features.showChangeDriverInfo === false) { // do not enter page if feature is not enabled
            return false;
        }
        this.isModal = this.navParams.get('isModal');
    }

    btnConfirm() {
        if (this.driverDetailsForm.invalid === true) {
            this.notify.error('Please resolve all validation errors.');
            return;
        }

        const loader = this.loading.show();
        this.driver.updatePlateNumber(this.driverDetailsForm.get('newPlateNumber').value).then(() => {
            loader.dismiss();

            this.notify.success('Plate Number changed successfully!');
            if (this.isModal === true) {
                this.viewCtrl.dismiss(); // close dialog if was opened as dialog
            }
            this.driverDetailsForm.reset(); // clear the form
        }).catch((err) => {
            loader.dismiss();

            this.notify.error(err);
        });
    }

    btnClose() {
        if (this.isModal === true) {
            this.viewCtrl.dismiss();
        }
    }
}
