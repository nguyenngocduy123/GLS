/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input } from '@angular/core';

import { Note } from '../../providers/classes/note';

/**
 * Standardised way to display Note columns
 *
 * @class VrpJobnoteLabelComponent
 */
@Component({
    selector: 'vrp-jobnote-label',
    templateUrl: 'vrp-jobnote-label.html',
})
export class VrpJobnoteLabelComponent {
    /**
     * List of notes to display
     *
     * @type {Note[]}
     */
    @Input() notes: Note[];

    constructor() { }
}
