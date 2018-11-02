/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, EventEmitter, Output } from '@angular/core';

import { NotificationProvider } from '../../providers/notification/notification';

/**
 * Clear button in pages with form
 *
 * @class VrpBtnClearComponent
 */
@Component({
    selector: 'vrp-btn-clear',
    templateUrl: 'vrp-btn-clear.html',
})
export class VrpBtnClearComponent {
    /**
     * Callback button when button is pressed
     *
     * @type {EventEmitter<void>}
     */
    @Output() pressed: EventEmitter<void> = new EventEmitter();

    constructor(
        public notify: NotificationProvider,
    ) { }

    btnClear() {
        this.pressed.emit();
    }

    showToast() {
        this.notify.info('Press and hold to clear all input');
    }
}
