/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, Platform, AlertController } from 'ionic-angular';

import { Globals } from '../../../globals';
import { trim as _trim } from 'lodash-es';
import { CameraProvider } from '../../../providers/camera/camera';
import { CurrentJobProvider } from '../../../providers/current-job/current-job';
import { Job } from '../../../providers/classes/job';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-add-note',
    templateUrl: 'add-note.html',
})
export class AddNotePage extends NavigationProvider {
    private btnBackEvent: Function;
    job: Job;

    maxNumNotePhotos: number = Globals.setting.note.maxNumPhoto;
    optionRequired: boolean = Globals.setting.note.optionRequired;
    optionList: string[] = Globals.setting.note.options;

    constructor(
        public alertCtrl: AlertController,
        public camera: CameraProvider,
        public currentJob: CurrentJobProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
        public platform: Platform,
    ) {
        super({ navCtrl: navCtrl, platform: platform });
    }

    ionViewCanEnter() {
        this.job = this.currentJob.getDetails();
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        }

        // notes need to init manually to prevent overwriting of original values
        // it's also to ensure that the value is up-to-date
        this.currentJob.initNotes();
    }

    ionViewWillEnter() {
        if (this.currentJob.isSuccess() === false) { // disable back button if job is unsuccessful (i.e. first page is add note)
            this.btnBackEvent = this.overwriteBackBtnEvent(() => {
                const alert = this.alertCtrl.create({
                    title: 'Confirm',
                    subTitle: 'Are you sure you want to go back to previous page?',
                    buttons: [
                        {
                            text: 'Cancel',
                            role: 'cancel',
                        }, {
                            text: 'Yes',
                            handler: () => {
                                this.goPreviousPage();
                            },
                        },
                    ],
                });
                alert.present();
            });
        }
    }

    ionViewDidLeave() {
        if (this.btnBackEvent) {
            this.btnBackEvent();
        }
    }

    btnConfirm() {
        this.currentJob.noteOption = _trim(this.currentJob.noteOption);
        this.currentJob.noteText = _trim(this.currentJob.noteText);

        // check if option is required based on global setting
        if (this.optionRequired === true && !this.currentJob.noteOption) {
            this.notify.error('Please select a template message.');

        } else if (this.currentJob.isSuccess() === true) {
            this.goPage('PodPage');

        } else if (!this.currentJob.noteOption && !this.currentJob.noteText) {
            // note is required for failed job
            this.notify.error('Message (template / text) is required.');

        } else {
            this.goPage('SummaryPage');
        }
    }

    btnAddPhoto() {
        if (this.currentJob.notePhotos.length >= this.maxNumNotePhotos) {
            this.notify.error(`Maximum number of photos (${this.maxNumNotePhotos}) reached.`);
        } else {
            this.camera.getPicture()
                .then((fileUri) => this.currentJob.notePhotos.push(fileUri))
                .catch(() => { });
        }
    }

    btnRemovePhoto(photo: string) {
        const index = this.currentJob.notePhotos.indexOf(photo, 0);
        if (index > -1) {
            this.currentJob.notePhotos.splice(index, 1);
        }
    }

    btnClear() {
        this.currentJob.initNotes(true);
    }
}
