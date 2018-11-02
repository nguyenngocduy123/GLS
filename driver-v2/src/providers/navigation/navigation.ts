/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { App, NavController, NavOptions, Platform, Tabs, Tab } from 'ionic-angular';
import { get as _get } from 'lodash-es';

import { Globals } from '../../globals';

/**
 * Arguments required to initialise constructor
 *
 * @interface INavigationArgs
 */
interface INavigationArgs {
    app?: App;
    navCtrl?: NavController;
    platform?: Platform;
}

/**
 * This class handles all general navigation events, such as page navigation,
 * tab navigation and hardware back button navigation.
 *
 * For normal pages,
 *  - `NavController` is required for page navigation
 *  - `App` is not necessary
 *
 * For tabs,
 *  - `NavController` is required for tab navigation
 *  - `App` is required for page navigation
 *
 * `platform` is required to use any hardware back button related functions
 *
 * @abstract
 * @class NavigationProvider
 * @example
 *  ```
 *  class HomePage extends NavigationProvider {
 *      constructor(
 *          public app: App,
 *          public navCtrl: NavController,
 *          public platform: Platform
 *      ) {
 *          super({ app: app, navCtrl: navCtrl, platform: platform });
 *      }
 *  }
 *  ```
 */
export abstract class NavigationProvider {
    private readonly navOptions: NavOptions = { animate: false, updateUrl: false };

    // private variables to prevent overwriting existing
    private rootNav: NavController;
    private tabsNav: Tabs;
    platform: Platform;
    app: App;

    constructor(
        init: INavigationArgs,
    ) {
        this.app = init.app;
        this.platform = init.platform;

        // if NavController object has a parent, then the page is a tab
        if (_get(init.navCtrl, 'parent')) {
            this.tabsNav = init.navCtrl.parent;
        } else {
            this.rootNav = init.navCtrl;
        }
    }

    /**
     * Go to page
     *
     * @param {string} page  Class name of page to go
     * @param {*} [params={}]  Navigation parameters to pass to destination page
     */
    goPage(page: string, params: any = {}): void {
        if (this.canNavigate() === true) {
            this.rootNav.push(page, params, this.navOptions);
        }
    }

    /**
     * Return to previous page
     *
     * @param {number} [numPage]  Return to page `numPage` away
     */
    goPreviousPage(numPage: number = 0): void {
        if (this.canNavigate() === true) {
            if (numPage === 0) {
                this.rootNav.pop(this.navOptions);
            } else {
                // as of 28 march 2018 popTo('page') does not work
                this.rootNav.popTo(this.rootNav.getByIndex(this.rootNav.length() - numPage), this.navOptions);
            }
        }
    }

    /**
     * Set home page as root. Home page is defined in `homePage` variable
     *
     * @param {*} [params={}]  Navigation parameters to pass to home page
     */
    goHomePage(params: any = {}): void {
        if (this.canNavigate() === true) {
            console.log(`[NAVIGATION] Going to ${Globals.home.page}`);
            this.rootNav.setRoot(Globals.home.page, params, this.navOptions);
        }
    }

    /**
     * Set login page as root. Login page is defined in `loginPage` variable
     *
     * @param {*} [params={}]  Navigation parameters to pass to login page
     */
    goLoginPage(params: any = {}): void {
        if (this.canNavigate() === true) {
            console.log(`[NAVIGATION] Going to ${Globals.login.page}`);
            this.rootNav.setRoot(Globals.login.page, params, this.navOptions);
        }
    }

    /**
     * Exit application
     */
    exitApp(): void {
        this.platform.exitApp();
    }

    /**
     * Overwrite hardware back button event. Don't provide `onPressed` to disable back
     * button entirely
     *
     * @param {Function} [onPressed=() => { }]  Callback function when back button is pressed
     * @returns {Function}  Function to unregister event
     */
    overwriteBackBtnEvent(onPressed: Function = () => { }): Function {
        if (this.platform) {
            return this.platform.registerBackButtonAction(onPressed, 10);
        } else {
            console.log('[WARN] platform is not initialised. Failed to disable back button.');
            return () => { };
        }
    }

    /**
     * Go to the next sibiling tab
     */
    goNextTab(): boolean {
        if ((this.tabsNav instanceof Tabs)) {
            const nextTab: Tab = this.tabsNav.getByIndex(this.tabsNav.getSelected().index + 1);
            if (nextTab && nextTab.show) {
                nextTab.enabled = true;
                this.tabsNav.select(nextTab, this.navOptions);
                return true;
            }
        } else {
            console.log('[WARN] There is no tab to navigate to. Failed to go next tab.');
        }
        return false;
    }

    /**
     * Whether page navigation is allowed
     *
     * @private
     * @returns {boolean}  True if page navigation is allowed
     */
    private canNavigate(): boolean {
        if (!this.rootNav && _get(this.app, 'getRootNav')) {
            // this needs to be initialised here because app may not be initialised when first passed into constructor
            this.rootNav = this.app.getRootNav();
        }
        return this.rootNav ? true : false;
    }
}
