/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, ModalController } from 'ionic-angular';

import { AttemptedJob } from '../../../providers/classes/job';
import { LoadingProvider } from '../../../providers/loading/loading';
import { NotificationProvider } from '../../../providers/notification/notification';
import { UserDriverProvider } from '../../../providers/user/user-driver';

@IonicPage()
@Component({
    selector: 'page-offline-sync',
    templateUrl: 'offline-sync.html',
})
export class OfflineSyncPage {
    offlineJobs: AttemptedJob[] = [];
    serverError: string; // show alert box instead of toast because it might take some time to sync

    constructor(
        public driver: UserDriverProvider,
        public loading: LoadingProvider,
        public modalCtrl: ModalController,
        public notify: NotificationProvider,
    ) { }

    ionViewWillLoad() {
        this.driver.getOfflineJobs()
            .then((jobs) => this.offlineJobs = jobs)
            .catch((err) => this.notify.error(err));
    }

    btnViewJob(job: AttemptedJob) {
        const modal = this.modalCtrl.create('OfflineJobModalPage', { job: job }, { enableBackdropDismiss: false });
        modal.present();
    }

    btnSyncJobs() {
        const loader = this.loading.show();
        this.serverError = undefined;

        this.driver.uploadOfflineJobs().then(() => {
            this.offlineJobs = [];
            loader.dismiss();
        }).catch((err) => {
            this.serverError = err || 'Unknown';
            loader.dismiss();
        });
    }
}
