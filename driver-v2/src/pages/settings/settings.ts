/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import { Globals } from '../../globals';

@IonicPage()
@Component({
    selector: 'page-settings',
    templateUrl: 'settings.html',
})
export class SettingPage {
    tabs = [];

    constructor(
        public navCtrl: NavController,
    ) {
        if (Globals.features.showChangeDriverInfo === true) { // hide page if feature is not enabled
            this.tabs.push({ page: 'ChangeDriverDetailsPage', title: 'Plate Number', icon: 'car' });
        }

        if (Globals.features.enableOfflineSync === true) { // hide page if feature is not enabled
            this.tabs.push({ page: 'OfflineSyncPage', title: 'Sync Jobs', icon: 'archive' });
        }

        if (Globals.features.showChangePassword === true) { // hide page if feature is not enabled
            this.tabs.push({ page: 'ResetPasswordPage', title: 'Reset Password', icon: 'md-key' });
        }

        // added last to ensure this tab appears last
        this.tabs.push({ page: 'LogoutPage', title: 'Logout', icon: 'log-out' });
    }
}
