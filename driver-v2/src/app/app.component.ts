/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuController, Platform, App } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Network } from '@ionic-native/network';
import 'rxjs/add/operator/distinctUntilChanged';

import { MenuName, Globals } from '../globals';
import { AuthProvider } from '../providers/user/auth';
import { NativeHTTP } from '../providers/driver-rest/native-http';
import { StorageProvider } from '../providers/storage/storage';
import { UserDriverProvider } from '../providers/user/user-driver';
import { NavigationProvider } from '../providers/navigation/navigation';

interface IPage {
    name: string;
    title: string;
    icon: string;
}

@Component({
    templateUrl: 'app.html',
})
export class MyApp extends NavigationProvider {
    allJobsMenuId: string = MenuName.AllJobs;
    allJobsMenuPages: IPage[] = [
        { name: 'AllJobsPage', title: 'Today\'s Jobs', icon: 'checkmark-circle' },
        { name: 'PlannerNotesPage', title: 'Planner Notes', icon: 'list' },
        { name: 'NextDayJobsPage', title: 'Next Day Jobs', icon: 'calendar' },
    ];

    constructor(
        public app: App,
        public auth: AuthProvider,
        public driver: UserDriverProvider,
        public keyboard: Keyboard,
        public menuCtrl: MenuController,
        public http: NativeHTTP,
        public network: Network,
        public platform: Platform,
        public statusBar: StatusBar,
        public storage: StorageProvider,
        public splashScreen: SplashScreen,
        public translate: TranslateService,
    ) {
        super({ app: app, platform: platform });
        this.initializeApp();
    }

    initializeApp() {
        this.platform.ready()
            .then(() => this.splashScreen.show())
            .then(() => this.storage.init()) // init storage to set url first
            .then(() => {
                // timeout error after this time
                this.http.setRequestTimeout(5);
                // send all data to server in json
                this.http.setDataSerializer('json');
                // enable ssl pinning if specified in globals
                const sslCertMode = (Globals.features.enableSSLPinning) ? 'pinned' : 'default';
                return this.http.setSSLCertMode(sslCertMode).catch(() => { }); // catch for web usage
            })
            .then(() => {
                // TODO: create preference provider and set according to globalization
                // indicate supported languages
                this.translate.addLangs(['en']);
                this.translate.setDefaultLang('en');
            })
            .then(() => this.auth.isLoggedIn().catch(() => this.auth.notifier.next(false)))// redirect to login page if any errors
            .then(() => {
                // hide menu for all pages
                this.menuCtrl.enable(false, this.allJobsMenuId);

                // hide footer when keyboard is open
                this.keyboard.onKeyboardShow().subscribe(() => document.body.classList.add('keyboard-is-open'));
                this.keyboard.onKeyboardHide().subscribe(() => document.body.classList.remove('keyboard-is-open'));

                // set status bar as special color when there is no internet
                this.setStatusBar();
                this.network.onDisconnect().subscribe(() => this.setStatusBar());
                this.network.onConnect().subscribe(() => {
                    this.setStatusBar();
                    this.auth.isLoggedIn();
                });

                this.splashScreen.hide();
            });

        // navigation guard, will navigate accordingly when user is logged out
        this.auth.notifier.distinctUntilChanged().subscribe((status) => {
            if (status === true) {
                setTimeout(() => this.goHomePage());
            } else if (status === false) {
                setTimeout(() => this.goLoginPage());
            }
        });

        if (this.platform.is('ios')) {
            this.platform.resume.subscribe(() => this.auth.isLoggedIn());
        }
    }

    btnOpenPage(page: IPage) {
        this.goPage(page.name);
    }

    btnMainPage() {
        this.goHomePage();
    }

    private setStatusBar() {
        if (this.network.type === 'none') {
            this.statusBar.backgroundColorByName('red');
        } else {
            this.statusBar.backgroundColorByName('black');
        }
    }
}
