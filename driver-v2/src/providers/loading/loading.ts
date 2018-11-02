/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { LoadingController, Loading, Platform } from 'ionic-angular';
import { NavigationProvider } from '../navigation/navigation';

@Injectable()
export class LoadingProvider extends NavigationProvider {
    constructor(
        public loadingCtrl: LoadingController,
        public platform: Platform,
    ) {
        super({ platform: platform });
    }

    /**
     * Show loader and disable back button while showing. Dismiss must be called manually.
     *
     * @param {string} [msg='Please wait']  Custom message to describe loader (if any)
     * @returns {Loading}
     */
    show(msg: string = 'Please wait'): Loading {
        const loader = this.loadingCtrl.create({ content: `${msg}...` });
        let btnBackEvent: Function = () => { };
        loader.willEnter.subscribe(() => btnBackEvent = this.overwriteBackBtnEvent());
        loader.onDidDismiss(() => btnBackEvent());
        loader.present();
        return loader;
    }
}
