/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, ViewController, Platform } from 'ionic-angular';

import { Globals, StorageKey } from '../../../globals';
import { StorageProvider } from '../../../providers/storage/storage';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-licence-agreement',
    templateUrl: 'licence-agreement.html',
})
export class LicenceAgreementPage extends NavigationProvider {
    private btnBackEvent: Function;

    constructor(
        public viewCtrl: ViewController,
        public storage: StorageProvider,
        public platform: Platform,
    ) {
        super({ platform: platform });
    }

    ionViewCanEnter() {
        if (Globals.features.showEula === false) { // do not enter page if feature is not enabled
            return false;
        } else {
            return this.storage.getKeyValue(StorageKey.Eula).then((hasAccepted) => {
                if (hasAccepted === 'true') {
                    return false;
                }
            });
        }
    }

    ionViewWillEnter() {
        this.btnBackEvent = this.overwriteBackBtnEvent();
    }

    ionViewDidLeave() {
        this.btnBackEvent();
    }

    btnAccept() {
        this.storage.setKeyValue(StorageKey.Eula, 'true');
        this.viewCtrl.dismiss();
    }
}
