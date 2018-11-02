/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, NavController, App } from 'ionic-angular';

import { SignaturePad } from 'angular2-signaturepad/signature-pad';
import { CurrentJobProvider } from '../../../../providers/current-job/current-job';
import { Job } from '../../../../providers/classes/job';
import { NotificationProvider } from '../../../../providers/notification/notification';
import { NavigationProvider } from '../../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-pod-signature',
    templateUrl: 'pod-signature.html',
})
export class PodSignaturePage extends NavigationProvider {
    @ViewChild(SignaturePad) signaturePad: SignaturePad;
    @ViewChild('signatureContainer') container: Content;

    // prevent signature canvas from becoming too big due to screen size
    // it is unlikely for users to utilise the entire canvas, so the signature will end up too small
    maxHeight: number = 480;
    job: Job;

    constructor(
        public app: App,
        public currentJob: CurrentJobProvider,
        public navCtrl: NavController,
        public notify: NotificationProvider,
    ) {
        super({ navCtrl: navCtrl, app: app });
    }

    ionViewCanEnter() {
        this.job = this.currentJob.getDetails();
        if (!(this.job instanceof Job)) {
            setTimeout(() => this.goHomePage());
            return false;
        }
    }

    ionViewWillEnter() {
        this.setDimensions();

        // reloads the original signature (in case user goes next page and comes back)
        if (this.currentJob.podSignatureData) {
            this.signaturePad.fromData(this.currentJob.podSignatureData);
        }
    }

    onDrawComplete() {
        // data is used for restore of data instead of base64 because of the quirks
        // of signature pad on devices with larger dpi
        this.currentJob.podSignatureData = this.signaturePad.toData();
        this.currentJob.podSignature = this.signaturePad.toDataURL();
    }

    btnConfirm() {
        if (this.signaturePad.isEmpty()) {
            this.notify.error('Signature is required.');
        }

        // if there is no next tab, it means that user is not allowed to take photo as pod
        const hasNextTab = this.goNextTab();
        if (!hasNextTab) {
            this.goPage('SummaryPage');
        }
    }

    btnClear() {
        this.currentJob.podSignatureData = undefined;
        this.currentJob.podSignature = undefined;
        this.signaturePad.clear();
    }

    private setDimensions() {
        const height: number = this.container.contentHeight;
        const width: number = this.container.contentWidth;

        let square: number = (height < width ? height : width) - 50;
        square = (square > this.maxHeight) ? this.maxHeight : square; // prevent canvas from becoming too big on bigger screens

        this.signaturePad.set('canvasWidth', square);
        this.signaturePad.set('canvasHeight', square);
        this.signaturePad.set('backgroundColor', 'rgb(255,255,255)');
    }
}
