/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { Globals } from '../../globals';
import { Job } from '../../providers/classes/job';
import { JobsApi } from '../../providers/driver-rest/driver-rest';
import { NotificationProvider } from '../../providers/notification/notification';
import { NavigationProvider } from '../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-complete-job-details',
    templateUrl: 'complete-job-details.html',
})
export class CompleteJobDetailsPage extends NavigationProvider {
    job: Job; // view details of this job
    statusText: string; // css for this job's status based on global config
    statusColor: string;
    jobAttemptedBefore: boolean = false;

    // images that will only load upon request
    notePhotos: string[];
    disableBtnNotePhotos: boolean = false;
    podPhotos: string[];
    disableBtnPod: boolean = false;

    constructor(
        public jobsApi: JobsApi,
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
        }

        this.jobAttemptedBefore = (this.job.isCompleted() || this.job.isUnsuccessful());
        const dictionary = Globals.jobStatusPair[this.job.Status];
        this.statusText = dictionary.title;
        this.statusColor = dictionary.color;
    }

    btnShowNotePhotos() {
        this.notify.info('Downloading note photos...');
        this.disableBtnNotePhotos = true;
        this.jobsApi.getNotePhotos(this.job.Id)
            .then((photos) => {
                if (photos === undefined || photos.length === 0) {
                    this.notePhotos = [];
                } else {
                    this.notePhotos = photos.map(this.base64ToDataUrl);
                }
            })
            .catch((err) => this.notify.error('Unable to download note photos.', err));
    }

    btnShowPod() {
        this.notify.info('Downloading proof of delivery...');
        this.disableBtnPod = true;
        this.jobsApi.getPodPhotos(this.job.Id)
            .then((photos) => {
                if (photos) {
                    this.podPhotos = [
                        this.base64ToDataUrl(photos.Signature),
                        this.base64ToDataUrl(photos.Photo),
                    ];
                } else {
                    this.podPhotos = [];
                }
            })
            .catch((err) => this.notify.error('Unable to download proof of delivery.', err));
    }

    private base64ToDataUrl(base64) {
        return base64 ? 'data:image/png;base64,' + base64 : undefined;
    }
}
