/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';

import { Globals, StorageKey } from '../../../globals';
import { CameraProvider } from '../../../providers/camera/camera';
import { NotificationProvider } from '../../../providers/notification/notification';
import { StorageProvider } from '../../../providers/storage/storage';

@IonicPage()
@Component({
    selector: 'page-scan-server-url',
    templateUrl: 'scan-server-url.html',
})
export class ScanServerUrlPage {
    url: string;
    urlText: string;

    constructor(
        public camera: CameraProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
        public storage: StorageProvider,
    ) { }

    ionViewDidEnter() {
        this.updateUrlText();
    }

    urlOnFocus() {
        if (!this.url) {
            this.url = 'http://';
        }
    }

    btnSave(useDefault: boolean) {
        this.setUrl(useDefault ? Globals.default.url : this.url);
    }

    btnScan() {
        this.camera.scanBarcode(true)
            .then((scanned) => this.setUrl(scanned.text))
            .catch(() => { });
    }

    private setUrl(url: string) {
        if (this.isValidUrl(url) === false) {
            this.notify.error('Invalid URL. URL must start with http or https.');
        } else {
            Globals.url = url;
            this.storage.setKeyValue(StorageKey.Url, url);
            this.updateUrlText();
            this.notify.info('URL has been updated successfully.');
        }
    }

    private isValidUrl(url: string) {
        if (url === undefined) {
            return false;
        } else {
            return /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.test(url.toLowerCase());
        }
    }

    /**
     * Only show some characters of the url to prevent people from misusing the server
     *
     * @private
     */
    private updateUrlText() {
        const serverUrl = Globals.url;
        const asteriskStrLen = serverUrl.length - 11;
        this.urlText = serverUrl.substring(0, 12) + Array(asteriskStrLen < 0 ? 0 : asteriskStrLen).join('*');
    }
}
