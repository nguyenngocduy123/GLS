/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, ViewChild } from '@angular/core';
import { IonicPage, MenuController, Navbar, NavController } from 'ionic-angular';

import { Globals, MenuName } from '../../../globals';
import { UserDriverProvider } from '../../../providers/user/user-driver';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-planner-notes',
    templateUrl: 'planner-notes.html',
})
export class PlannerNotesPage extends NavigationProvider {
    @ViewChild(Navbar) navBar: Navbar;

    constructor(
        public driver: UserDriverProvider,
        public menuCtrl: MenuController,
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
}
