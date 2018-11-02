/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input, OnInit } from '@angular/core';

import { Job } from '../../providers/classes/job';

/**
 * Short summary of a job
 * See `VrpJobDetailsComponent` to show detailed information of a job
 *
 * @class VrpJobSummaryComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'vrp-job-summary',
    templateUrl: 'vrp-job-summary.html',
})
export class VrpJobSummaryComponent implements OnInit {
    /**
     * Job to display
     *
     * @type {Job}
     */
    @Input() job: Job;

    constructor() { }

    ngOnInit() {
        if (this.job === undefined || !(this.job instanceof Job)) {
            throw new Error('Attribute `job` must be an instance of Job.');
        }
    }
}
