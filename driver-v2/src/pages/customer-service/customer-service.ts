/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

import { Job } from '../../providers/classes/job';
import { trim as _trim } from 'lodash-es';
import { LoadingProvider } from '../../providers/loading/loading';
import { NotificationProvider } from '../../providers/notification/notification';
import { MailApi } from '../../providers/driver-rest/driver-rest';

@IonicPage()
@Component({
    selector: 'page-customer-service',
    templateUrl: 'customer-service.html',
})
export class CustomerServicePage {
    private errorMsg: string = 'Unable to send message. Please contact customer service directly.';

    jobs: Job[];
    remarks: string;
    selectedTime: string;
    timeList: string[] = [
        '30 Minutes',
        '60 Minutes',
    ];

    constructor(
        public loading: LoadingProvider,
        public mailApi: MailApi,
        public navParams: NavParams,
        public notify: NotificationProvider,
        public viewCtrl: ViewController,
    ) { }

    ionViewCanEnter() {
        this.jobs = this.navParams.get('jobs');
        if (this.jobs === undefined || !this.jobs.length || !(this.jobs[0] instanceof Job)) { // assumes that the entire array consist of same object types
            this.viewCtrl.dismiss();
            this.notify.error(this.errorMsg);
            return false;
        }
    }

    btnSelectTime(time: string) {
        this.selectedTime = time;
    }

    btnSubmit() {
        if (this.isValid() === true) {
            const loader = this.loading.show();
            const message = {
                jobs: this.jobs.map((job) => job.toJSON()),
                lateBy: this.selectedTime,
                driverRemarks: this.remarks,
            };

            this.mailApi.send(message).then(() => {
                loader.dismiss();
                this.btnClear();
                this.viewCtrl.dismiss();
                this.notify.info('Message sent successfully.');

            }).catch((err) => {
                loader.dismiss();
                this.notify.error(this.errorMsg, err);
            });
        }
    }

    btnClear() {
        this.selectedTime = undefined;
        this.remarks = '';
    }

    private isValid() {
        this.remarks = _trim(this.remarks);

        const errors = [];
        if (this.selectedTime === undefined) {
            errors.push('Please select a time.');
        }
        if (!this.remarks) {
            errors.push('Please enter remarks.');
        }
        if (errors.length) {
            this.notify.error(errors.join(' '));
        }
        return errors.length === 0;
    }
}
