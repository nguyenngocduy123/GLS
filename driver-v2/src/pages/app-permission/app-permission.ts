/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, Platform, ViewController } from 'ionic-angular';
import { Subscription } from 'rxjs/Subscription';
import 'rxjs/add/operator/distinctUntilChanged';

import { Globals } from '../../globals';

import { AuthProvider } from '../../providers/user/auth';
import { GeolocationProvider } from '../../providers/geolocation/geolocation';
import { OperatingSystem, DiagnosticProvider } from '../../providers/diagnostic/diagnostic';
import { NavigationProvider } from '../../providers/navigation/navigation';
import { NotificationProvider } from '../../providers/notification/notification';

interface ISpecifications {
    recommend: number; // suggest minimum os version
    text: string; // text to display
}

@IonicPage()
@Component({
    selector: 'page-app-permission',
    templateUrl: 'app-permission.html',
})
export class AppPermissionPage extends NavigationProvider {
    private btnBackEvent: Function;
    private notifierEvent: Subscription; // listens to gps change event

    /**
     * Recommended specifications for each operating system
     *
     * @private
     */
    private readonly systemSpecs: { [os: string]: ISpecifications } = {
        [OperatingSystem.Android]: { recommend: 6, text: 'Android' },
        [OperatingSystem.iOS]: { recommend: 8, text: 'iOS' },
    };

    specs: ISpecifications; // recommended specifications for current operating system

    // indicates whether permission is granted for each feature
    permission: { [feature: string]: boolean } = {
        camera: false,
        location: false,
    };

    constructor(
        public auth: AuthProvider,
        public diagnostic: DiagnosticProvider,
        public geolocation: GeolocationProvider,
        public notify: NotificationProvider,
        public platform: Platform,
        public viewCtrl: ViewController,
    ) {
        super({ platform: platform });
    }

    ionViewCanEnter() {
        // check if permissions granted
        return Promise.all([
            this.diagnostic.hasCameraPermission(),
            this.diagnostic.hasLocationPermission(),
        ]).then((permission) => {
            this.permission.camera = permission[0];
            this.permission.location = permission[1];
        });
    }

    ionViewWillEnter() {
        this.btnBackEvent = this.overwriteBackBtnEvent();
        this.notifierEvent = this.diagnostic.hasLocationNotifier.distinctUntilChanged().subscribe((enabled) => this.permission.location = enabled);

        this.specs = this.systemSpecs[this.diagnostic.deviceOS];
    }

    ionViewDidLeave() {
        this.btnBackEvent();
        this.notifierEvent.unsubscribe();
    }

    btnEnableLocation() {
        this.diagnostic.requestLocation();
    }

    btnEnableCamera() {
        this.diagnostic.requestCamera();
    }

    btnContinue() {
        if (this.hasRequiredPermissions() === true) {
            this.geolocation.start(Globals.user.vehicleId, Globals.user.vehiclePlateNumber, Globals.user.vehicleUserGroup);
            this.viewCtrl.dismiss();
        } else {
            this.notify.error('Some permissions are required.');
        }
    }

    private hasRequiredPermissions() {
        // boolean check can be extended easily if new permissions are required
        return this.permission.location;
    }
}
