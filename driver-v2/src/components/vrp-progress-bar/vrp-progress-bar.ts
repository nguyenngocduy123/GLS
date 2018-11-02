/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input, OnChanges } from '@angular/core';

import { Globals } from '../../globals';
import { Job } from '../../providers/classes/job';

/**
 * Progress bar based on job list input
 *
 * @class VrpProgressBarComponent
 * @implements {OnChanges}
 */
@Component({
    selector: 'vrp-progress-bar',
    templateUrl: 'vrp-progress-bar.html',
})
export class VrpProgressBarComponent implements OnChanges {
    /**
     * List of jobs to show progress bar on
     *
     * @type {Job[]}
     */
    @Input() jobs: Job[];

    showProgress: boolean = false; // to toggle detail view
    summary: object[] = [];
    remainingPercent: number = 100; // used to keep track the calculated percentage to prevent overflow

    constructor() { }

    ngOnChanges() {
        if (this.jobs !== undefined && this.jobs.length) {
            if (!(this.jobs[0] instanceof Job)) { // assumes that the entire array consist of same object types
                throw new Error('Attribute `jobs` must be an array of Job instances.');
            }

            this.reset();
            const jobsByCategory = this.groupBy(this.jobs, 'Status');

            for (const status in jobsByCategory) {
                const jobs = jobsByCategory[status];
                const statusDictionary = Globals.jobStatusPair[status];

                this.summary.push({
                    title: statusDictionary.title,
                    color: statusDictionary.color,
                    count: jobs.length,
                    percent: this.calPercent(jobs.length),
                });
            }
        }
    }

    toggleLegend() {
        this.showProgress = !(this.showProgress);
    }

    private reset() {
        this.showProgress = false;
        this.summary = [];
        this.remainingPercent = 100;
    }

    private groupBy(arr, key) {
        // codes from https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_groupby
        return arr.reduce((r, v, _i, _a, k = v[key]) => ((r[k] || (r[k] = [])).push(v), r), {});
    }

    private calPercent(count) {
        const percent = Math.ceil(count / this.jobs.length * 100);

        if (percent < this.remainingPercent) {
            this.remainingPercent = this.remainingPercent - percent;
            return percent;
        } else {
            return this.remainingPercent;
        }
    }
}
