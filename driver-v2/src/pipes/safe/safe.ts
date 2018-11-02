/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Pipe, PipeTransform } from '@angular/core';

/**
 * Santizes urls to solve unsafe value exceptions
 *
 * @class SafePipe
 * @implements {PipeTransform}
 */
@Pipe({
    name: 'safe',
})
export class SafePipe implements PipeTransform {
    constructor() { }

    transform(url) {
        return window['Ionic'].WebView.convertFileSrc(url);
    }
}
