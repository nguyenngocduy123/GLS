import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { remove as _remove } from 'lodash-es';

import { PlannerUtils } from '@app/planner/classes/planner-utils';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerJobMarker } from '@app/planner/classes/planner-job-marker';
import { PlannerPath } from '@app/planner/classes/planner-path';
import { DISPATCH_JOB_SELECTION_CONFIG } from '@app/planner/planner.config';

@Component({
    selector: 'vrp-planner-dispatch',
    templateUrl: './planner-dispatch.component.html',
    styleUrls: ['./planner-dispatch.component.scss'],
})
export class PlannerDispatchComponent implements OnInit, OnChanges {

    private _originalUnasignedJobMarkers: any[];

    @Input() selectedVehicle;
    @Input() vehicles: any[];
    @Input() unassignedJobMarkers: PlannerJobMarker[];

    @Output() jobsAddedToVehicle: EventEmitter<any> = new EventEmitter();

    tableHeight: number = 800;

    readonly itemActions: any[] = [
        { tooltip: 'Open', icon: 'launch', click: (item) => this._dialog.openOrderDetailById(item.DeliveryMasterId) },
    ];

    left: any = {
        vehicle: undefined, data: [], selected: [],
        column: DISPATCH_JOB_SELECTION_CONFIG,
        selectActions: [
            { label: 'Move Up', icon: 'file_upload', click: (selected) => this._moveJobsUpOrDown(this.left, selected, true) },
            { label: 'Move Down', icon: 'file_download', click: (selected) => this._moveJobsUpOrDown(this.left, selected, false) },
            { label: 'Move to Right', icon: 'fast_forward', click: (selected) => this._moveJobsLeftorRight(this.left, this.right, selected) },
        ],
    };

    right: any = {
        vehicle: undefined, data: [], selected: [],
        column: DISPATCH_JOB_SELECTION_CONFIG,
        selectActions: [
            { label: 'Move Up', icon: 'file_upload', click: (selected) => this._moveJobsUpOrDown(this.right, selected, true) },
            { label: 'Move Down', icon: 'file_download', click: (selected) => this._moveJobsUpOrDown(this.right, selected, false) },
            { label: 'Move to Left', icon: 'fast_rewind', click: (selected) => this._moveJobsLeftorRight(this.right, this.left, selected) },
        ],
    };

    constructor(
        private _plannerData: PlannerDataService,
        private _dialog: PlannerDialogService,
        private _toast: VrpToastService,
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 190;
    }

    ngOnInit() {
        this.onResize();
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('PlannerDispatchComponent -> ngOnChanges -> changes', changes);
        if (changes.unassignedJobMarkers.firstChange) {
            this.left.vehicle = this.selectedVehicle || this.vehicles[0];
        }
        this._originalUnasignedJobMarkers = this.unassignedJobMarkers.map((m) => m);
        this.updateTable(this.left);
        this.updateTable(this.right);
    }

    getAndUpdateTable(panel: any) {
        panel.vehicle = this.vehicles.find((t) => t.Id === panel.selectedId);
        this.updateTable(panel);
    }

    updateTable(panel: any) {
        panel.data = [];

        if (panel.vehicle) { // has some vehicle ==> vehicle
            if (panel.vehicle.route) {
                const markers = panel.vehicle.route.markers;
                if (markers && markers.length > 0) {
                    panel.data = markers.map((m) => m.tags);
                }
            }
        } else { // ==> show unassigned orders
            panel.data = this.unassignedJobMarkers.map((m) => m.tags);
        }
    }

    private _moveJobsUpOrDown(from: any, movedJobs: any[], moveUp: boolean): boolean {
        const movedOrderIds = movedJobs.map((j) => j.DeliveryMasterId); // get all jobs related to selectedJobs
        if (PlannerUtils.containFinishedJob(movedJobs)) {
            this._handleFinishedJobs(movedJobs);
            return true;
        }

        if (!from.vehicle) {
            return true;
        }

        if (!this._isEnoughRoomToMove(from.data, movedJobs, moveUp)) {
            this._dialog.error('PLANNER_DISPATCH.MAX_LIMIT_ERROR');
            return true;
        }

        if (!this._isShipmentConstraintSatisfy(from.data, movedJobs, moveUp)) {
            this._dialog.error('PLANNER_DISPATCH.SHIPMENT_ORDER_ERROR');
            return true;
        }

        const route: PlannerPath = from.vehicle.route;
        if (route && movedJobs) {
            this._sortJobArraysBasedOnIndex(movedJobs, from.data);
            if (moveUp) {
                for (let i = 0; i < movedJobs.length; i++) {
                    const p = from.data.indexOf(movedJobs[i]);
                    route.swapMarkers(p, p - 1);
                }
            } else {
                for (let i = movedJobs.length - 1; i >= 0; i--) {
                    const p = from.data.indexOf(movedJobs[i]);
                    route.swapMarkers(p, p + 1);
                }
            }
            route.isChanged = true;
            route.updateLatLngs();

            this.updateTable(from);

            this._toast.shortAlert(`${this._getMovedOrdersLabel(movedOrderIds)} have been moved ${moveUp ? 'up' : 'down'}`);
            this._notifyChanges();
        }
        return true;
    }

    private _moveJobsLeftorRight(from: any, to: any, selectedJobs: any[]): boolean {
        const movedOrderIds = selectedJobs.map((j) => j.DeliveryMasterId); // get all jobs related to selectedJobs
        const movedJobs: any[] = from.data.filter((j) => movedOrderIds.includes(j.DeliveryMasterId)); // all jobs related to same orderIds will be moved
        this._sortJobArraysBasedOnIndex(movedJobs, from.data);
        if (PlannerUtils.containFinishedJob(movedJobs)) {
            this._handleFinishedJobs(movedJobs);
            return true;
        }

        let assignedJobs = [];
        if (from.vehicle && !to.vehicle) { // move jobs from vehicle to unassignedJob
            const movedMarkers = this._removeJobsFromVehicle(from.vehicle, movedJobs);
            this.unassignedJobMarkers.push(...movedMarkers); // add to undefined jobs
            this.updateTable(from);
            this.updateTable(to);
            this._toast.shortAlert(`${this._getMovedOrdersLabel(movedOrderIds)} have been removed from ${from.vehicle.Id}`);
        } else if (from.vehicle && to.vehicle) { // move jobs from vehicle to vehicle
            // Tenative measure
            // To be un-commented when implementation such that master planner can move any orders freely is completed
            // if (!PlannerUtils.isSameUserGroup(from.vehicle, to.vehicle) || PlannerUtils.isSuperUserGroup(to.vehicle)) {
            // 	this._dialog.alert(`Cannot move jobs between different Usergroups`);
            // 	return true;
            // }
            const movedMarkers = this._removeJobsFromVehicle(from.vehicle, movedJobs);
            this._addJobsToVehicle(to.vehicle, movedMarkers);
            this.updateTable(from);
            this.updateTable(to);
            this._toast.shortAlert(`${this._getMovedOrdersLabel(movedOrderIds)} have been moved from ${from.vehicle.Id} to ${to.vehicle.Id}`);
        } else if (!from.vehicle && to.vehicle) { // move jobs from unassignedJobs to vehicle
            // Tenative measure
            // To be un-commented when implementation such that master planner can move any orders freely is completed
            // if (!movedJobs.every((j) => PlannerUtils.isSameUserGroup(j, to.vehicle))) {
            // 	this._dialog.alert(`Cannot move jobs between different Usergroups`);
            // 	return true;
            // }
            assignedJobs = movedOrderIds;
            const movedMarkers = this._removeJobsFromUnassignedJobs(movedJobs);
            this._addJobsToVehicle(to.vehicle, movedMarkers);
            this.updateTable(from);
            this.updateTable(to);
            this._toast.shortAlert(`${this._getMovedOrdersLabel(movedOrderIds)} have been added to ${to.vehicle.Id}`);
        }

        this._notifyChanges(assignedJobs);
        return false;
    }

    private _getMovedOrdersLabel(orderIds: string[]): string {
        return orderIds.length <= 2 ? orderIds.join(', ') : (orderIds.length + ' orders');
    }

    private _removeJobsFromVehicle(vehicle: any, jobs: any[]): PlannerJobMarker[] {
        const route: PlannerPath = vehicle.route;

        const movedMarkers: any[] = route.markers.filter((m) => jobs.includes(m.tags));
        console.log('PlannerDispatchComponent -> movedMarkers', movedMarkers);
        if (movedMarkers.length > 0) {
            movedMarkers.forEach((m) => {
                route.removeMarker(m); // remove from route
            });
            route.isChanged = true;
            route.updateLatLngs();
        }
        return movedMarkers;
    }

    private _addJobsToVehicle(vehicle: any, movedMarkers: PlannerJobMarker[]) {
        console.log('_addJobsToVehicle', vehicle, movedMarkers);
        if (movedMarkers.length > 0) {
            this.jobsAddedToVehicle.emit({ vehicle: vehicle, markers: movedMarkers }); // insert to the end of toRoute
            vehicle.route.isChanged = true;
        }
    }

    private _removeJobsFromUnassignedJobs(jobs: any[]): PlannerJobMarker[] {
        return _remove(this.unassignedJobMarkers, (m) => jobs.includes(m.tags));
    }

    private _isEnoughRoomToMove(allJobs: any[], movedJobs: any[], moveUp: boolean): boolean {
        return movedJobs.every((job, i) => {
            const p = allJobs.indexOf(job);
            if (moveUp && p >= 1) {
                return true;
            } else if (!moveUp && p <= allJobs.length - 2) {
                return true;
            } else {
                return false;
            }
        });
    }

    private _isShipmentConstraintSatisfy(allJobs: any[], movedJobs: any[], moveUp: boolean): boolean {
        return movedJobs.every((job, i) => {
            const p = allJobs.indexOf(job);
            if (moveUp && PlannerUtils.isJobDelivery(job) && p >= 1) { // if trying to move delivery job up
                const prevJob = allJobs[p - 1];
                if (prevJob.DeliveryMasterId === job.DeliveryMasterId && PlannerUtils.isJobPickup(prevJob) && !movedJobs.includes(prevJob)) {
                    return false;
                } else {
                    return true;
                }
            } else if (!moveUp && PlannerUtils.isJobPickup(job) && p <= allJobs.length - 2) { // if trying to move pickup job down
                const nextJob = allJobs[p + 1];
                if (nextJob.DeliveryMasterId === job.DeliveryMasterId && PlannerUtils.isJobDelivery(nextJob) && !movedJobs.includes(nextJob)) {
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        });

    }

    private _notifyChanges(movedOrderIds: any = []) {
        const routes = this.vehicles.filter((t) => t.route && t.route.isChanged).map((t) => t.route);
        const unassignedOrderIds = this.unassignedJobMarkers
            .filter((m) => !this._originalUnasignedJobMarkers.includes(m))
            .map((m) => m.tags.DeliveryMasterId);

        this._plannerData.onPlanChanged.next({ routes, unassignedOrderIds, movedOrderIds });  // inform planner-monitor that plan has changed
    }

    private _sortJobArraysBasedOnIndex(jobs, parentArray) {
        if (jobs.length >= 2) {
            jobs.sort((a, b) => {
                const iA: number = parentArray.indexOf(a);
                const iB: number = parentArray.indexOf(b);
                return iA - iB;
            });
        }
    }

    private _handleFinishedJobs(movedJobs) {
        const finishedJobs = PlannerUtils.getFinishedJobs(movedJobs);
        this._dialog.alert('PLANNER_DISPATCH.FINISHED_JOBS_MSG', 'Alert', finishedJobs);
    }
}
