/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { some as _some } from 'lodash-es';

import { Globals } from '../../globals';
import { CurrentJobProvider } from '../../providers/current-job/current-job';
import { Job } from '../../providers/classes/job';
import { NotificationProvider } from '../../providers/notification/notification';
import { UserDriverProvider } from '../../providers/user/user-driver';
import { NavigationProvider } from '../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-current-job',
    templateUrl: 'current-job.html',
})
export class CurrentJobPage extends NavigationProvider {
    enableMail: boolean = Globals.features.showJobsMail; // hide button if feature is not enabled

    job: Job;
    disableBtnDo: boolean = false;

    constructor(
        public currentJob: CurrentJobProvider,
        public driver: UserDriverProvider,
        public launchNavigator: LaunchNavigator,
        public navCtrl: NavController,
        public navParams: NavParams,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl });
    }

    ionViewCanEnter() {
        this.job = this.navParams.get('job');
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        } else if (this.job.isCompleted() === true) {
            this.notify.error(`Job ${this.job.DeliveryMasterId} (${this.job.JobType}) has already been completed`);
            return false;
        }

        this.currentJob.reset();
        // do not allow driver to do the job if another job of the same order needs to complete first
        this.disableBtnDo = !this.driver.isPreviousJobComplete(this.job);
    }

    btnCustomerService() {
        this.goPage('CustomerServicePage', { jobs: [this.job] });
    }

    btnNavigate() {
        // launch navigator is to allow driver to pick a map of their choice instead of
        // forcing them to use a specific app (e.g. google map)
        this.launchNavigator.availableApps()
            .catch(() => undefined) // always resolve
            .then((availableApps) => {
                const atLeastOneAvailable = _some(availableApps, (app) => app);
                if (!atLeastOneAvailable) {
                    this.notify.error('There is no navigation app available on this phone.');
                }
                this.launchNavigator.navigate([this.job.Lat, this.job.Lng]);
            });
    }

    btnSuccess() {
        if (this.allowAttempt() === true) {
            this.currentJob.setSuccess(this.job.Id);
            this.goPage('ItemsHandledPage');
        }
    }

    btnFail() {
        if (this.allowAttempt() === true) {
            this.currentJob.setFail(this.job.Id);
            this.goPage('AddNotePage');
        }
    }

    private allowAttempt() {
        if (this.disableBtnDo === true) {
            this.notify.error('Please ensure the previous pickup job has been completed first.');
        }
        return (this.disableBtnDo === false);
    }
}
