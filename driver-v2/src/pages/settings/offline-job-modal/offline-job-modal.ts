/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavParams, ViewController } from 'ionic-angular';

import { AttemptedJob } from '../../../providers/classes/job';

@IonicPage()
@Component({
    selector: 'page-offline-job-modal',
    templateUrl: 'offline-job-modal.html',
})
export class OfflineJobModalPage {
    job: AttemptedJob;

    constructor(
        public navParams: NavParams,
        public viewCtrl: ViewController,
    ) { }

    ionViewCanEnter() {
        this.job = this.navParams.get('job');
        if (this.job === undefined || !(this.job instanceof AttemptedJob)) {
            this.viewCtrl.dismiss({ error: 'NavParams `job` must be an instance of AttemptedJob.' });
            return false;
        }
    }

    btnClose() {
        this.viewCtrl.dismiss();
    }
}
