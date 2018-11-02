/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, Platform, ModalController } from 'ionic-angular';

import { Globals } from '../../globals';
import { AuthProvider } from '../../providers/user/auth';
import { DiagnosticProvider } from '../../providers/diagnostic/diagnostic';
import { UserDriverProvider } from '../../providers/user/user-driver';
import { NavigationProvider } from '../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-home',
    templateUrl: 'home.html',
})
export class HomePage extends NavigationProvider {
    private btnBackEvent: Function;
    headerText: string = Globals.home.title;

    constructor(
        public alertCtrl: AlertController,
        public auth: AuthProvider,
        public diagnostic: DiagnosticProvider,
        public driver: UserDriverProvider,
        public modalCtrl: ModalController,
        public navCtrl: NavController,
        public platform: Platform,
    ) {
        super({ navCtrl: navCtrl, platform: platform });
    }

    ionViewWillEnter() {
        this.btnBackEvent = this.overwriteBackBtnEvent(() => {
            const alert = this.alertCtrl.create({
                title: 'Confirm',
                subTitle: 'Are you sure you want to exit app?',
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                    }, {
                        text: 'Yes',
                        handler: () => {
                            this.exitApp();
                        },
                    },
                ],
            });
            alert.present();
        });
    }

    ionViewDidEnter() {
        if (this.auth.forceChangePassword) {
            const modal = this.modalCtrl.create('ResetPasswordPage', { isModal: true }, { enableBackdropDismiss: false });
            return modal.present();
        }
    }

    ionViewDidLeave() {
        if (this.btnBackEvent) {
            this.btnBackEvent();
        }
    }

    btnDoJob() {
        if (this.driver.currentJob !== undefined) {
            this.goPage('CurrentJobPage', { job: this.driver.currentJob });
        }
    }

    btnAllJobs() {
        this.goPage('AllJobsPage');
    }

    btnSettings() {
        this.goPage('SettingPage');
    }
}
