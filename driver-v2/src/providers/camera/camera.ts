/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { BarcodeScanner, BarcodeScannerOptions, BarcodeScanResult } from '@ionic-native/barcode-scanner';
import { normalizeURL } from 'ionic-angular';
import { get as _get } from 'lodash-es';

import { Globals } from '../../globals';
import { NotificationProvider } from '../notification/notification';

@Injectable()
export class CameraProvider {
    /**
     * Common / universal options to take photo with camera
     *
     * @private
     * @type {CameraOptions}
     */
    private readonly cameraOptions: CameraOptions = {
        quality: 50,
        destinationType: this.camera.DestinationType.FILE_URI,
        encodingType: this.camera.EncodingType.JPEG,
        sourceType: this.camera.PictureSourceType.CAMERA,
        mediaType: this.camera.MediaType.PICTURE,
        allowEdit: true,
        targetWidth: 1200,
        targetHeight: 1200,
        saveToPhotoAlbum: false,
        correctOrientation: true,
    };

    /**
     * Common / universal options to scan barcodes
     *
     * @private
     * @type {BarcodeScannerOptions}
     */
    private readonly scanOptions: BarcodeScannerOptions = {
        preferFrontCamera: false,
        showFlipCameraButton: true,
        showTorchButton: true,
        torchOn: false,
        disableAnimations: true,
        disableSuccessBeep: true,
        formats: Globals.setting.item.acceptedCodes,
        // Android only
        resultDisplayDuration: 0,
        prompt: 'Press back button to cancel',
    };

    constructor(
        public camera: Camera,
        public notify: NotificationProvider,
        public scanner: BarcodeScanner,
    ) { }

    /**
     * Opens view to take one photo. Displays error in toast (if any)
     *
     * @returns {Promise<string>}  Uri path to image on storage
     */
    getPicture(): Promise<string> {
        return this.camera.getPicture(this.cameraOptions).then((fileUri) => {
            return normalizeURL(fileUri);
        }).catch((err) => {
            if (err !== 'No Image Selected' && err !== 'cordova_not_available') {
                this.notify.error(err);
            }
            throw err;
        });
    }

    /**
     * Opens view to scan one barcode. Displays error in toast (if any)
     *
     * @param {boolean} [qrOnly=false]  Set true to scan QR code only
     * @returns {Promise<BarcodeScanResult>}
     */
    scanBarcode(qrOnly: boolean = false): Promise<BarcodeScanResult> {
        const formats = qrOnly ? { formats: 'QR_CODE' } : {};
        const options = Object.assign({}, this.scanOptions, formats);

        return this.scanner.scan(options).then((result) => {
            if (result.cancelled === true) {
                throw new Error('cancelled');
            }
            return result;
        }).catch((err) => {
            if (err.toString() !== 'Error: cancelled') {
                this.notify.error(_get(err, 'text', 'Unable to scan.'));
            }
            throw err;
        });
    }
}
