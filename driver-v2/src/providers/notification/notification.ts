/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import { Toast, ToastController, ToastOptions } from 'ionic-angular';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { trim as _trim, includes as _includes, toString as _toString } from 'lodash-es';

@Injectable()
export class NotificationProvider {
    private readonly maxCharacters = 254;
    private readonly toastOptions: ToastOptions = {
        showCloseButton: true,
        position: 'top',
        duration: 3000,
    };

    constructor(
        public toastCtrl: ToastController,
        public localNotifications: LocalNotifications,
    ) { }

    /**
     * Show toast notification for errors
     *
     * @param {string|Error} msg  Error message
     * @param {string|Error} serverError  Error message from server
     * @returns {Promise<Toast>}
     */
    error(msg: string | Error, serverError?: string | Error): Promise<Toast> {
        console.log('[TOAST] Error:', msg, serverError);
        let message = _toString(msg);

        // show string header only if the header does not contain text 'Error' (aesthetic purpose)
        if (!_includes(message, 'Error')) {
            message = `Error: ${message}`;
        }

        // append server error
        if (serverError !== undefined) {
            message += '\n\nServer Error: ';
            if (serverError instanceof Error) {
                message += serverError.toString();
            } else {
                message += JSON.stringify(serverError);
            }
        }
        return this.show({ message: message, duration: (this.toastOptions.duration + 3000) });
    }

    /**
     * Show toast notification for info / misc
     *
     * @param {string} msg  Message to display
     * @returns {Promise<Toast>}
     */
    info(msg: string): Promise<Toast> {
        return this.show({ message: JSON.stringify(msg) });
    }

    /**
     * Show toast notification for success messages
     *
     * @param {string} msg  Success message
     * @returns {Promise<Toast>}
     */
    success(msg: string): Promise<Toast> {
        console.log('[TOAST] Success:', msg);
        return this.show({ message: `Success: ${msg}` });
    }

    /**
     * Show local notification that will appear in notification drawer
     *
     * @param {string} msg  Message to display
     */
    local(msg: string): void {
        this.localNotifications.schedule({
            title: 'Logistics',
            text: msg,
            priority: 2,
            launch: true,
            // Android only
            clock: true,
            lockscreen: true,
            smallIcon: 'res://logo', // res://new_job
            color: '#1f7bb6',
        });
    }

    /**
     * Show toast notification
     *
     * @private
     * @param {ToastOptions} config  Custom config for each toast notification. Overrides default options
     * @returns {Promise<Toast>}
     */
    private show(config: ToastOptions): Promise<Toast> {
        // reduce the length of message if necessary to prevent toast taking up entire page space
        config.message = _trim(config.message);
        if (config.message) {
            let truncatedMessage = config.message.substring(0, this.maxCharacters);
            truncatedMessage += (truncatedMessage === config.message) ? '' : '...'; // add ellipse if text was truncated
            config.message = truncatedMessage;
        }
        return this.toastCtrl.create(Object.assign({}, this.toastOptions, config)).present();
    }
}
