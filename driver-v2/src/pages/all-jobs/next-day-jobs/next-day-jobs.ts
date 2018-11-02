/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, ViewChild } from '@angular/core';
import { IonicPage, MenuController, Navbar, NavController } from 'ionic-angular';
import * as moment from 'moment';

import { Globals, MenuName } from '../../../globals';
import { Job } from '../../../providers/classes/job';
import { JobsApi } from '../../../providers/driver-rest/driver-rest';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-next-day-jobs',
    templateUrl: 'next-day-jobs.html',
})
export class NextDayJobsPage extends NavigationProvider {
    @ViewChild(Navbar) navBar: Navbar;

    date: string;
    jobs: Job[] = [];

    constructor(
        public jobsApi: JobsApi,
        public menuCtrl: MenuController,
        public notify: NotificationProvider,
        public navCtrl: NavController,
    ) {
        super({ navCtrl: navCtrl });
    }

    ionViewWillEnter() {
        if (Globals.features.showAllJobsMenu === true) {
            this.menuCtrl.enable(true, MenuName.AllJobs);
        }
    }

    ionViewDidLoad() {
        this.navBar.backButtonClick = () => this.goHomePage();
    }

    ionViewWillLeave() {
        this.menuCtrl.enable(false, MenuName.AllJobs);
    }

    ionViewCanEnter() {
        // TODO: allow server to determine when is the next day
        const nextDay = moment().add(1, 'day');
        this.date = nextDay.format('DD MMM YYYY').toString();
        return this.jobsApi.get({ date: nextDay.toISOString() })
            .then((jobs) => this.jobs = jobs)
            .catch((err) => {
                this.notify.error('Unable to get next day\'s jobs.', err);
                throw err;
            });
    }
}
