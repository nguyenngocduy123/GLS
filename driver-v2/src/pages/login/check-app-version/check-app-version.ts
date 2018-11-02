/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, Platform } from 'ionic-angular';

import { Globals } from '../../../globals';
import { OperatingSystem, DiagnosticProvider } from '../../../providers/diagnostic/diagnostic';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-check-app-version',
    templateUrl: 'check-app-version.html',
})
export class CheckAppVersionPage extends NavigationProvider {
    private btnBackEvent: Function;

    img: { path: string, height: string } = Globals.login.image;
    appstore: string;

    constructor(
        public diagnostic: DiagnosticProvider,
        public notify: NotificationProvider,
        public platform: Platform,
    ) {
        super({ platform: platform });
    }

    ionViewWillEnter() {
        this.appstore = (this.diagnostic.deviceOS === OperatingSystem.Android) ? 'PlayStore' : 'AppStore';
        this.btnBackEvent = this.overwriteBackBtnEvent();
    }

    ionViewDidLeave() {
        this.btnBackEvent();
    }

    btnRedirect() {
        this.diagnostic.getPackageName().then((name) => {
            let url = '';
            if (this.diagnostic.deviceOS === OperatingSystem.Android) {
                url = `market://details?id=${name}`;
            } else if (this.diagnostic.deviceOS === OperatingSystem.iOS) {
                url = `itms-apps://itunes.apple.com/app/id${name}`;
            }

            if (url) {
                window.open(url);
            } else {
                this.notify.error(`Please go to the ${this.appstore} directly.`);
            }
        });
    }
}
