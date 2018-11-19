import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { concat, Observable } from 'rxjs';
import * as format from 'date-fns/format';
import { omit as _omit } from 'lodash-es';

import { DEFAULT_NEW_ORDER } from '@app/planner/planner.config';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { PlannerDeliveryDetailComponent } from './delivery-detail/planner-delivery-detail.component';
import { PlannerDeliveryMasterComponent } from './delivery-master/planner-delivery-master.component';

@Component({
    selector: 'vrp-planner-order-detail-dialog',
    templateUrl: './planner-order-detail-dialog.component.html',
    styleUrls: ['./planner-order-detail-dialog.component.scss'],
})
export class PlannerOrderDetailDialogComponent implements OnInit {

    f: FormGroup;
    order: FormGroup;
    jobs: FormArray;

    selectedIndex: number = 0;
    selectedJob: any;

    originalOrder: any;

    createNew: boolean = false;

    isPowerPlanner: boolean = false;
    readonly: boolean = false;

    constructor(
        private _fb: FormBuilder,
        private _dialogRef: MatDialogRef<PlannerOrderDetailDialogComponent>,
        private _plannerRest: PlannerRestService,
        private _authentication: VrpAuthenticationService,
        private _toast: VrpToastService,
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        this.isPowerPlanner = this._authentication.isPowerPlanner();
    }

    ngOnInit(): void {
        const data = this.data;
        this.readonly = data.readonly;
        if (data.order) {
            this.originalOrder = Object.assign({}, data.order);
            this.createForm(this.originalOrder);
        } else if (data.orderId) {
            this._plannerRest.getDeliveryMaster(data.orderId, true).subscribe((res) => {
                if (!res) {
                    this._toast.shortAlert(`Order ${data.orderId} does not exist on database`);
                    return this._dialogRef.close();
                }
                this.originalOrder = res;
                this.createForm(this.originalOrder);
                console.log('PlannerOrderDetailsDialogComponent ->  constructor -> this.order', this.originalOrder);
            }, (err) => {
                this._toast.shortAlert(`Order ${data.orderId} does not exist on database`, err);
                this._dialogRef.close();
            });
        } else {// create new
            this.originalOrder = Object.assign({}, DEFAULT_NEW_ORDER, { Id: format(new Date(), 'YYYY-MM-DD_HHmmss') });
            if (this._authentication.isRestrictedPlanner()) {
                this.originalOrder.UserGroup = this._authentication.getUserGroup();
            }
            this.createNew = true;
            this.createForm(this.originalOrder);
            console.log('PlannerOrderDetailsDialogComponent ->  constructor -> createNew -> this.order', this.originalOrder);
        }
    }

    selectTab(tabName: string, jobIndex: number) {
        switch (tabName) {
            case 'Customer Info':
                this.selectedIndex = 0;
                break;
            case 'Summary':
                this.selectedIndex = 1;
                break;
            default:
                const job = this.jobs.value[jobIndex];
                const jobId = job.Id;
                this.selectedJob = jobId ? this.originalOrder.DeliveryDetails.find((j) => j.Id && j.Id === jobId) : undefined;
                this.selectedIndex = 2 + jobIndex;
                break;
        }
    }

    save() {
        const allQueries = [];
        if (this.createNew) {
            const order = this.f.value;
            const newOrder = Object.assign({}, this.order.value, { DeliveryDetails: this.jobs.value.map((j) => _omit(j, ['Id'])) });
            if (this._authentication.isRestrictedPlanner()) {
                newOrder.UserGroup = this._authentication.getUserGroup();
            }

            newOrder.DeliveryDetails.forEach((j) => {
                if (j.VerificationCode) {
                    j.VerificationCode = { Code: j.VerificationCode };
                }
            });
            console.log('PlannerOrderDetailDialogComponent -> save -> newOrder', newOrder, order);
            allQueries.push(this._plannerRest.create(newOrder, 'DeliveryMaster'));
        } else {
            if (this.order.dirty) {
                allQueries.push(this._plannerRest.update(this.order.value, 'DeliveryMaster'));
            }

            if (this.jobs.dirty) {
                // check if there is any job deleted
                const updatedJobIds = this.jobs.value.map((j) => j.Id).filter((id) => id);
                const jobIdsTobeDeleted = this.originalOrder.DeliveryDetails.map((j) => j.Id).filter((id) => !updatedJobIds.includes(id));

                if (jobIdsTobeDeleted.length > 0) {
                    allQueries.push(this._plannerRest.deleteMany(jobIdsTobeDeleted, 'DeliveryDetail'));
                }

                this.jobs.controls.forEach((j) => {
                    allQueries.push(...this._getJobChangeQueries(j as FormGroup));
                });
            }
        }

        concat(...allQueries).subscribe((answer) => { // run for every single query completed
            this._toast.shortAlert(`Order has been saved/created successfully`);
        }, (err) => this._toast.shortAlert(`Failed to save order`, err),  // err
            () => { // completed
                this._dialogRef.close();
            });
    }

    createForm(o) {
        this.order = PlannerDeliveryMasterComponent.createForm(o, this.isPowerPlanner);
        this.jobs = new FormArray(o.DeliveryDetails.map((j) => PlannerDeliveryDetailComponent.createForm(j)));

        this.f = this._fb.group({
            DeliveryMaster: this.order,
            DeliveryDetails: this.jobs,
        });
    }

    addNewJob() {
        const firstJob = this.jobs.at(0).value;
        const _items = firstJob.DeliveryItems.map((i) => { return { ItemId: i.ItemId, ItemQty: i.ItemQty }; });
        const newJob = Object.assign({}, firstJob, { Id: undefined, DeliveryItems: _items });
        if (firstJob.JobType === 'PICKUP') { // add delivery job with JobSequence increased by 1
            Object.assign(newJob, { JobType: 'DELIVERY', JobSequence: firstJob.JobSequence + 1 });
            this.jobs.push(PlannerDeliveryDetailComponent.createForm(newJob)); // add to the end of array
            this.selectTab('Job', 1);
        } else { // then add pickup job with JobSequence decrease by 1
            Object.assign(newJob, { JobType: 'PICKUP', JobSequence: firstJob.JobSequence - 1 });
            this.jobs.insert(0, PlannerDeliveryDetailComponent.createForm(newJob)); // add to  the beginning of array
            this.selectTab('Job', 0);
        }
        console.log('PlannerOrderDetailDialogComponent -> addNewJob -> newJob', newJob);
    }

    jobDelete(jobIndex) {
        this.jobs.removeAt(jobIndex);
        this.selectTab('Job', 0);
    }

    private _getJobChangeQueries(job: FormGroup): Observable<any>[] {
        let queries = [];
        const updatedValue = job.value;
        const jobId = updatedValue.Id;
        if (jobId) { // edit existing jobs on server
            updatedValue.StartTimeWindow = this._isValid(updatedValue.StartTimeWindow) ? format(updatedValue.StartTimeWindow) : '';
            updatedValue.EndTimeWindow = this._isValid(updatedValue.EndTimeWindow) ? format(updatedValue.EndTimeWindow) : '';
            if (updatedValue.VerificationCode) {
                queries.push(this._plannerRest.updateVerificationCode(jobId, updatedValue.VerificationCode)); // manually upsert verificationCode
            } else {
                queries.push(this._plannerRest.deleteVerificationCode(jobId)); // manually delete verificationCode
            }
            queries.push(this._plannerRest.update(updatedValue, 'DeliveryDetail'),
                // , this._plannerRest.notify({ jobId })
            );

            if (job.get('DeliveryItems').dirty) {
                const newItems = job.get('DeliveryItems').value.filter((m) => m.ItemId && m.ItemQty > 0).map((m) => { return { ItemId: m.ItemId, ItemQty: m.ItemQty }; });
                queries.push(this._plannerRest.replaceDeliveryItemsOfJob(jobId, newItems));
            }

        } else { // create new job
            updatedValue.DeliveryMasterId = this.originalOrder.Id; // set order Id
            queries = [this._plannerRest.create(_omit(updatedValue, ['Id']), 'DeliveryDetail')];
        }

        return queries;
    }

    private _isValid(dateIn) {
        return !isNaN(new Date(dateIn).getTime());
    }
}
