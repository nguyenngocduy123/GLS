/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, NavController, Platform, AlertController } from 'ionic-angular';

import { Globals, ItemInputMethod } from '../../../globals';
import { CameraProvider } from '../../../providers/camera/camera';
import { CurrentJobProvider } from '../../../providers/current-job/current-job';
import { Job } from '../../../providers/classes/job';
import { NotificationProvider } from '../../../providers/notification/notification';
import { NavigationProvider } from '../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-items-handled',
    templateUrl: 'items-handled.html',
})
export class ItemsHandledPage extends NavigationProvider {
    private btnBackEvent: Function;

    inputType: ItemInputMethod = Globals.setting.item.defaultInput;
    allowSwitchInput: boolean = Globals.setting.item.allowSwitchInput;

    job: Job;
    inputByKeyboard: boolean = (this.inputType === ItemInputMethod.Keyboard);

    constructor(
        public alertCtrl: AlertController,
        public camera: CameraProvider,
        public currentJob: CurrentJobProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
        public platform: Platform,
    ) {
        super({ navCtrl: navCtrl, platform: platform });
    }

    ionViewCanEnter() {
        this.job = this.currentJob.getDetails();
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        }

        // items need to init manually to prevent overwriting of original values
        // it's also to ensure that the items data is up-to-date
        this.currentJob.initItems();
    }

    ionViewWillEnter() {
        this.btnBackEvent = this.overwriteBackBtnEvent(() => {
            const alert = this.alertCtrl.create({
                title: 'Confirm',
                subTitle: 'Are you sure you want to go back to previous page?',
                buttons: [
                    {
                        text: 'Cancel',
                        role: 'cancel',
                    }, {
                        text: 'Yes',
                        handler: () => {
                            this.goPreviousPage();
                        },
                    },
                ],
            });
            alert.present();
        });
    }

    ionViewDidLeave() {
        this.btnBackEvent();
    }

    switchInput() {
        if (this.allowSwitchInput === true) {
            // toggle input type
            this.inputType = (this.inputType === ItemInputMethod.Keyboard) ? ItemInputMethod.Barcode : ItemInputMethod.Keyboard;
            this.inputByKeyboard = (this.inputType === ItemInputMethod.Keyboard);

            // clear all input
            this.btnClear();

            // indicate input is by barcode or not
            this.currentJob.inputByBarcode = (this.inputType === ItemInputMethod.Barcode);
        } else {
            this.notify.error('You are not allowed to change input method.');
        }
    }

    notifySwitch() {
        this.notify.info('Existing input will be cleared. Press and hold button to confirm switch.');
    }

    btnConfirm() {
        // TODO: check if can use FormBuilder to handle this
        const hasValidItems = this.currentJob.items.find((item) => item.actual > 0);
        if (hasValidItems) {
            this.goPage('AddNotePage');
        } else {
            this.notify.error('At least 1 item must have quantity more than 0.');
        }
    }

    btnScan(item) {
        this.camera.scanBarcode().then((scanned) => {
            const code = scanned.text;

            if (item.scanned.indexOf(code) > -1) {
                this.notify.info('Barcode has been scanned before');
            } else {
                item.scanned.push(scanned.text);
                item.actual = (item.actual || 0) + 1;
            }
        }).catch(() => { });
    }

    btnClear() {
        this.currentJob.initItems(true);
    }
}
