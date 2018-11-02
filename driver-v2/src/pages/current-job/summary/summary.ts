/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { AlertController, IonicPage, NavController, Platform } from 'ionic-angular';

import { find as _find } from 'lodash-es';
import { Job } from '../../../providers/classes/job';
import { CurrentJobProvider } from '../../../providers/current-job/current-job';
import { LoadingProvider } from '../../../providers/loading/loading';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';
import { UserDriverProvider } from '../../../providers/user/user-driver';

@IonicPage()
@Component({
    selector: 'page-summary',
    templateUrl: 'summary.html',
})
export class SummaryPage extends NavigationProvider {
    job: Job;
    delivered: boolean;

    constructor(
        public alertCtrl: AlertController,
        public currentJob: CurrentJobProvider,
        public driver: UserDriverProvider,
        public loading: LoadingProvider,
        public platform: Platform,
        public navCtrl: NavController,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl });
    }

    ionViewCanEnter() {
        this.job = this.currentJob.getDetails();
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        } else if (this.currentJob.isSuccess() === true && this.currentJob.podSignature === undefined) {
            this.notify.error('Signature is required');
            return false;
        }

        this.delivered = this.currentJob.isSuccess();
    }

    btnDone() {
        const jobExists = _find(this.driver.jobs, { Id: this.currentJob.id });
        if (!jobExists) {
            this.notify.error('This job has been deleted from your job list!');
            this.goPage('AllJobsPage');
            return;
        }

        const loader = this.loading.show('Updating server. This may take some time, please wait');
        if (this.platform.is('ios')) {
            loader.dismiss();
        }
        this.currentJob.complete().then(() => {
            if (this.platform.is('android')) {
                loader.dismiss();
            }
            this.notify.info('Job has been done successfully');
            this.goHomePage();

        }).catch((err) => {
            loader.dismiss();
            // check if error happened because item list has changed while driver was executing the job
            // this may happen when the order is modified and a websocket message comes in
            if (err === 'invalid_items') {
                const alert = this.alertCtrl.create({
                    title: 'Error',
                    subTitle: 'Items list have been updated. Please check item list again.',
                    buttons: [{
                        text: 'OK',
                        handler: () => {
                            this.goPreviousPage(4); // go to items page
                        },
                    }],
                });
                alert.present();
            } else {
                this.notify.error('Unable to update server.', err);
            }
        });
    }
}
