/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, Platform } from 'ionic-angular';
import { Network } from '@ionic-native/network';

import { AuthProvider } from '../../../providers/user/auth';
import { LoadingProvider } from '../../../providers/loading/loading';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-logout',
    templateUrl: 'logout.html',
})
export class LogoutPage extends NavigationProvider {
    disableBtnLogout: boolean = false;

    constructor(
        public auth: AuthProvider,
        public loading: LoadingProvider,
        public network: Network,
        public platform: Platform,
    ) {
        super({ platform: platform });
    }

    ionViewWillEnter() {
        if (this.network.type === 'none') {
            this.disableBtnLogout = true;
        }
    }

    btnLogout() {
        const loader = this.loading.show();
        this.auth.logout().then(() => {
            loader.dismiss();
        }).catch(() => {
            loader.dismiss();
        });
    }

    btnExit() {
        this.exitApp();
    }
}
