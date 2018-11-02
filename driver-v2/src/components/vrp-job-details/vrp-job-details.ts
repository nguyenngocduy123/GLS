/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from 'ionic-angular';

import { Job, IDeliveryItem } from '../../providers/classes/job';
import { LoadingProvider } from '../../providers/loading/loading';

/**
 * Displays all necessary information of a job.
 * See `VrpJobSummaryComponent` to show short summary of a job instead
 *
 * @class VrpJobDetailsComponent
 * @implements {OnInit}
 */
@Component({
    selector: 'vrp-job-details',
    templateUrl: 'vrp-job-details.html',
})
export class VrpJobDetailsComponent implements OnInit {
    /**
     * Flag to indicate whether to show items section
     *
     * @type {boolean}
     */
    @Input() showItems: boolean = false;

    /**
     * Job to display
     *
     * @type {Job}
     */
    @Input() job: Job;

    constructor(
        public loading: LoadingProvider,
        public modalCtrl: ModalController,
    ) { }

    ngOnInit() {
        if (this.job === undefined || !(this.job instanceof Job)) {
            throw new Error('Attribute `job` must be an instance of Job.');
        }
    }

    btnViewItem(item: IDeliveryItem) {
        const loader = this.loading.show('Getting item information');
        const modal = this.modalCtrl.create('ItemDetailsPage', { deliveryItem: item });
        modal.present().then(() => loader.dismiss());
    }
}
