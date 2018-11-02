/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input, OnInit } from '@angular/core';
import { PhotoViewer } from '@ionic-native/photo-viewer';

/**
 * Standardised way to any photos
 *
 * @class VrpPhotosComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'vrp-photos',
    templateUrl: 'vrp-photos.html',
})
export class VrpPhotosComponent implements OnInit {
    /**
     * Photos to display, can be in base64 or storage path.
     * Will be shown as 2 images per row
     *
     * @type {string[]}
     */
    @Input() photos?: string[] = [];

    /**
     * One photo to display, can be in base64 or storage path
     * Will be shown as 1 image per row
     *
     * @type {string}
     */
    @Input() photo?: string;

    /**
     * Flag to indicate whether to show remove button
     *
     * @type {boolean}
     */
    @Input() allowRemove: boolean = false;

    constructor(
        public photoViewer: PhotoViewer,
    ) { }

    ngOnInit() {
        if (this.photos === undefined && this.photo === undefined) {
            throw new Error('Either `photos` or `photo` must be provided.');
        } else if (this.photos !== undefined && !Array.isArray(this.photos)) {
            throw new Error('Attribute `photos` must be an array.');
        } else if (this.photo !== undefined && typeof this.photo !== 'string') {
            throw new Error('Attribute `photo` must be a string.');
        }
    }

    /**
     * Open photoviewer view that allows zooming, panning and sharing
     *
     * @param {string} photo
     */
    btnViewPhoto(photo: string) {
        this.photoViewer.show(photo);
    }

    btnRemovePhoto(photo: string) {
        const index = this.photos.indexOf(photo, 0);
        if (index > -1) {
            this.photos.splice(index, 1);
        }
    }
}
