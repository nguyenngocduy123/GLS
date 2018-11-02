/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, Tab } from 'ionic-angular';

import { Job } from '../../../providers/classes/job';
import { CurrentJobProvider } from '../../../providers/current-job/current-job';
import { Globals } from '../../../globals';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';

/**
 * List of pages, referenced by their class names, to display as tabs
 */
enum TabPageName {
    Code = 'VerifyCodePage',
    Signature = 'PodSignaturePage',
    Photo = 'PodPhotoPage',
}

class CustomTab {
    page: TabPageName;
    title: string;
    icon: string;
    show?: boolean = true;
    visited?: boolean = false;
    enabled?: boolean = false;

    constructor(init?: Partial<CustomTab>) {
        Object.assign(this, init);
    }
}

@IonicPage()
@Component({
    selector: 'page-pod',
    templateUrl: 'pod.html',
})
export class PodPage extends NavigationProvider {
    job: Job;
    tabs: CustomTab[] = [
        new CustomTab({ page: TabPageName.Code, title: 'Code', icon: 'lock', enabled: true }),
        new CustomTab({ page: TabPageName.Signature, title: 'Signature', icon: 'create' }),
    ];

    constructor(
        public currentJob: CurrentJobProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl });

        if (Globals.features.showPodPhotoTab === true) {
            this.tabs.push(new CustomTab({ page: TabPageName.Photo, title: 'Photo', icon: 'camera' }));
        }
    }

    ionViewCanEnter() {
        this.job = this.currentJob.getDetails();
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        }

        if (this.job.hasVerificationCode() === false) {
            this.removeTab(TabPageName.Code);
            this.enablePodTabs();

        } else if (this.currentJob.verified === true) {
            this.enablePodTabs();
        }
    }

    tabSelected(tab: Tab) {
        this.tabs[tab.index].visited = true;
    }

    private enablePodTabs() {
        this.enableTab(TabPageName.Signature);
        this.enableTab(TabPageName.Photo);
    }

    private removeTab(tabPage: TabPageName) {
        const tabToBeRemoved = this.tabs.find((tab) => tab.page === tabPage);
        if (tabToBeRemoved) {
            tabToBeRemoved.show = false;
            tabToBeRemoved.enabled = false;
        }
    }

    private enableTab(tabPage: TabPageName) {
        const tabToBeEnabled = this.tabs.find((tab) => tab.page === tabPage);
        if (tabToBeEnabled) {
            tabToBeEnabled.enabled = true;
        }
    }
}
