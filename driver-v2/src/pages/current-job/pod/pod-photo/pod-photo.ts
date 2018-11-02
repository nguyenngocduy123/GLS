/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { App, IonicPage } from 'ionic-angular';

import { CameraProvider } from '../../../../providers/camera/camera';
import { CurrentJobProvider } from '../../../../providers/current-job/current-job';
import { Globals } from '../../../../globals';
import { NotificationProvider } from '../../../../providers/notification/notification';
import { NavigationProvider } from '../../../../providers/navigation/navigation';

@IonicPage()
@Component({
    selector: 'page-pod-photo',
    templateUrl: 'pod-photo.html',
})
export class PodPhotoPage extends NavigationProvider {
    constructor(
        public app: App,
        public camera: CameraProvider,
        public currentJob: CurrentJobProvider,
        public notify: NotificationProvider,
    ) {
        super({ app: app });
    }

    btnTakePhoto() {
        this.camera.getPicture()
            .then((fileUri) => this.currentJob.podPhoto = fileUri)
            .catch(() => { });
    }

    btnConfirm() {
        if (Globals.setting.pod.photoRequired === true && this.currentJob.podPhoto === undefined) {
            this.notify.error('Photo is required.');
        } else {
            this.goPage('SummaryPage');
        }
    }

    btnClear() {
        this.currentJob.podPhoto = undefined;
    }
}
