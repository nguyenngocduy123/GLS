/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, ModalController } from 'ionic-angular';

import { Globals } from '../../globals';
import { AuthProvider } from '../../providers/user/auth';
import { DiagnosticProvider } from '../../providers/diagnostic/diagnostic';
import { LoadingProvider } from '../../providers/loading/loading';
import { NotificationProvider } from '../../providers/notification/notification';
import { NavigationProvider } from '../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-login',
    templateUrl: 'login.html',
})
export class LoginPage extends NavigationProvider {
    img: { path: string, height: string } = Globals.login.image;
    enableChangeUrl = Globals.features.showChangeUrl;

    username: string = Globals.user.username;
    password: string;
    showPassword: boolean = false;

    constructor(
        public auth: AuthProvider,
        public diagnostic: DiagnosticProvider,
        public loading: LoadingProvider,
        public modalCtrl: ModalController,
        public navCtrl: NavController,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl });
    }

    ionViewDidEnter() {
        this.diagnostic.isAppUpdated().then((isUpdated) => {
            if (isUpdated === false) {
                const modal = this.modalCtrl.create('CheckAppVersionPage', {}, { enableBackdropDismiss: false });
                return modal.present();
            }
        }).then(() => {
            const modal = this.modalCtrl.create('LicenceAgreementPage', {}, { enableBackdropDismiss: false });
            modal.present();
        });
    }

    btnTogglePasswordView() {
        this.showPassword = !this.showPassword;
    }

    btnChangeUrl() {
        this.goPage('ScanServerUrlPage');
    }

    btnLogIn() {
        if (!this.username) {
            this.notify.error('Username is required');
            return;
        } else if (!this.password) {
            this.notify.error('Password is required');
            return;
        }

        const loader = this.loading.show('Logging in');
        this.auth.login(this.username, this.password).then(() => {
            loader.dismiss();

            const modal = this.modalCtrl.create('ChangeDriverDetailsPage', { isModal: true }, { enableBackdropDismiss: false });
            modal.onDidDismiss(() => this.goHomePage());
            modal.present();
        }).catch((err) => {
            loader.dismiss();

            this.notify.error(err);
        });
    }
}
