/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { NavigationProvider } from '../../providers/navigation/navigation';

/**
 * Header of all pages
 *
 * @class VrpHeaderComponent
 * @extends {NavigationProvider}
 */
@Component({
    selector: 'vrp-header',
    templateUrl: 'vrp-header.html',
})
export class VrpHeaderComponent extends NavigationProvider {
    /**
     * Flag to indicate whether to direct user to login page instead of home page
     *
     * @type {boolean}
     */
    @Input() toLoginPage: boolean = false;

    /**
     * Flag to indicate whether a confirmation dialog should be shown before redirecting
     *
     * @type {boolean}
     */
    @Input() showDialog: boolean = false;

    constructor(
        public alertCtrl: AlertController,
        public navCtrl: NavController,
    ) {
        super({ navCtrl: navCtrl });
    }

    goMainPage() {
        if (this.showDialog === false) {
            this.go();
        } else {
            const alert = this.alertCtrl.create({
                title: 'Confirm',
                subTitle: 'Are you sure you want to go main page?',
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                    }, {
                        text: 'Yes',
                        handler: () => {
                            this.go();
                        },
                    },
                ],
            });
            alert.present();
        }

    }

    private go() {
        if (this.toLoginPage === false) {
            this.goHomePage();
        } else {
            this.goLoginPage();
        }
    }
}
