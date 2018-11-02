/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import { CurrentJobProvider } from '../../../../providers/current-job/current-job';
import { NotificationProvider } from '../../../../providers/notification/notification';
import { NavigationProvider } from '../../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-verify-code',
    templateUrl: 'verify-code.html',
})
export class VerifyCodePage extends NavigationProvider {
    code: string;

    constructor(
        public currentJob: CurrentJobProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl });
    }

    btnConfirm() {
        // check if verification code required for this job
        if (this.currentJob.verified === false) {
            const job = this.currentJob.getDetails();
            this.currentJob.verified = job.verifyCode(this.code);

            if (this.currentJob.verified === false) {
                // show error toast if code required but is incorrect
                this.notify.error('Incorrect verification code.');
                return;
            }
        }

        this.currentJob.verified = true;
        this.goNextTab();
    }
}
