/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input, OnChanges } from '@angular/core';

import { Globals } from '../../globals';
import { JobType } from '../../providers/classes/job';

/**
 * Standardised way to display JobType column
 *
 * @class VrpJobtypeLabelComponent
 * @implements {OnChanges}
 */
@Component({
    selector: 'vrp-jobtype-label',
    templateUrl: 'vrp-jobtype-label.html',
})
export class VrpJobtypeLabelComponent implements OnChanges {
    /**
     * Value of JobType column
     *
     * @type {JobType}
     */
    @Input() jobtype: JobType;

    text: string;
    color: string;

    constructor() { }

    ngOnChanges() {
        if (this.jobtype === undefined) {
            throw new Error('Attribute `jobtype` is required.');
        }

        const jobTypeDictionary = Globals.jobTypePair[this.jobtype];
        this.text = jobTypeDictionary.title;
        this.color = jobTypeDictionary.color;
    }
}
