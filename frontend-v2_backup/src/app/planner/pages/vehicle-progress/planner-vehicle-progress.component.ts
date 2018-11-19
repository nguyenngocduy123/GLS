import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import * as isBefore from 'date-fns/is_before';

import { VrpUtils } from '@app/vrp-common';
import { STATUS_COLORS, STATUS_LABELS } from '@app/planner/planner.config';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';

interface IVehicleStats {
    Id: string;
    DriverUsername: string;
    totalJobs: number;
    series: any[];
    recent?: any;
    next?: any;
}

@Component({
    selector: 'vrp-planner-vehicle-progress',
    templateUrl: './planner-vehicle-progress.component.html',
    styleUrls: ['./planner-vehicle-progress.component.scss'],
})
export class PlannerVehicleProgressComponent implements OnInit, OnDestroy {

    private _subscriptions: Subscription[] = [];

    protected timeFilter: { start: string, end: string } = { start: '', end: '' };

    jobs: any[];
    vehicles: any[];

    readonly statusColors = STATUS_COLORS.map((c) => c).splice(1, 7);

    readonly statusLabels: any[] = STATUS_LABELS.map((c) => c).splice(0, 7);

    searchDriverNameTerm: string;

    filteredVehicleStats: any[] = [];
    vehicleStats: IVehicleStats[] = [];
    allStats: any[] = [];

    maxValue: number = 5;

    innerHeight: number = 500;

    constructor(
        private _route: ActivatedRoute,
        private _dialog: PlannerDialogService,
        private _plannerData: PlannerDataService,
    ) {
        this._plannerData.addListeners(['Vehicle', 'DeliveryDetail']);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.innerHeight = window.innerHeight - 65;
    }

    ngOnInit() {
        this.onResize();
        const vehicleObject = this._plannerData.Vehicle;
        const jobObject = this._plannerData.DeliveryDetail;
        this._subscriptions = [
            vehicleObject.data$.subscribe((res) => { // subscribe to listen to data
                this.vehicles = res;
                console.log('PlannerVehicleProgressComponent -> ngOnInit ->Vehicle:get', this.vehicles);
                this.loadVehicles();
            }),

            vehicleObject.update$.subscribe((msg) => {
                console.log('PlannerVehicleProgressComponent -> ngOnInit ->Vehicle:update', msg);
                this.loadVehicles();
            }),

            jobObject.data$.subscribe((res) => { // subscribe to listen to data
                console.log('PlannerVehicleProgressComponent -> ngOnInit ->DeliveryDetail:get', res);
                this.jobs = res;
                this.loadJobs();
            }),

            jobObject.update$.subscribe((msg) => {
                console.log('PlannerVehicleProgressComponent -> ngOnInit ->DeliveryDetail:update', msg);
                this.loadJobs();
            }),
        ];

        this._route.queryParams.subscribe((params: any) => {
            if (params.timeFilter) {
                const tf: string[] = params.timeFilter.split('-');
                this.timeFilter = { start: tf[0], end: tf[1] };
                this.loadJobs();
            }
        });
    }

    ngOnDestroy(): void {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    loadVehicles() {
        if (this.vehicles || this.vehicles.length > 0) {
            this.vehicles.forEach((t) => {
                const v = this.vehicleStats.find((m) => m.Id === t.Id);
                if (v) {
                    Object.assign(v, t);
                } else {
                    // this.vehicleStats.push(Object.assign({}, t));
                }
            });
            this.filter();
        }
    }

    loadJobs() {
        this.vehicleStats = [];
        this.filteredVehicleStats = [];

        if (!this.jobs || this.jobs.length === 0) {
            this.allStats = this.statusLabels.map((status) => ({ status, data: [] })).splice(1, 7);
            return;
        } else {
            const _jobs = this.jobs.filter((m) => VrpUtils.isTimeWindowWithinRange(m, this.timeFilter));
            console.log('PlannerVehicleProgressComponent -> loadJobs -> _jobs', _jobs);

            const _allStats: any[] = this.statusLabels.map((status) => ({ status, data: [] }));
            const _vehicleStatsObject = {};

            _jobs.forEach((d, i) => {
                if (d.VehicleId) {
                    if (!_vehicleStatsObject[d.VehicleId]) {
                        _vehicleStatsObject[d.VehicleId] = {
                            series: this.statusLabels.map((status, index) => ({ status, data: [] })).splice(0, 6),
                            totalJobs: 0,
                        };
                    }
                    const t = _vehicleStatsObject[d.VehicleId];
                    t.totalJobs++; // count total job
                    t.series[d.Status].data.push(d); // push data
                    this._updateRecentDelivery(t, d);
                    this._updateNextDelivery(t, d);

                    _allStats[d.Status].data.push(d);
                } else {
                    _allStats[6].data.push(d);
                }
            });

            this.allStats = _allStats.splice(1, 7);
            let _maxValue = 5;

            Object.keys(_vehicleStatsObject).forEach((id) => {
                const t = _vehicleStatsObject[id];
                t.series.splice(0, 1);
                _maxValue = Math.max(t.totalJobs, _maxValue);
                const v = this.vehicleStats.find((m) => m.Id === id);
                if (v) {
                    Object.assign(v, t);
                } else {
                    const vehicle = this.vehicles && this.vehicles.find((m) => m.Id === id);
                    this.vehicleStats.push(vehicle ? Object.assign({}, vehicle, t) : Object.assign({ Id: id }, t));
                }
            });

            this.maxValue = _maxValue;
        }

        this.filter();
    }

    filter() {
        this.filteredVehicleStats = this.vehicleStats.filter((d) => (d.Id + d.DriverUsername).search(new RegExp(this.searchDriverNameTerm, 'i')) > -1).sort((a, b) => {
            if (a.recent && !b.recent) {
                return -1;
            } else if (!a.recent && b.recent) {
                return 1;
            } else if (a.recent && b.recent) {
                return isBefore(a.recent.ActualDeliveryTime, b.recent.ActualDeliveryTime) ? 1 : -1;
            } else {
                return a.Id > b.Id ? 1 : -1;
            }
        });
    }

    openJobs(jobs: any[], title: string = undefined) {
        if (jobs && jobs.length > 0) {
            if (jobs.length === 1) {
                this._dialog.openOrderDetailById(jobs[0].DeliveryMasterId, false);
            } else {
                this._dialog.openJobList(jobs, title);
            }
        }
    }

    openAllJobs(v: IVehicleStats) {
        const allJobs = [];
        v.series.forEach((d) => allJobs.push(...d.data));
        this.openJobs(allJobs, `Jobs assigned to Driver ${v.DriverUsername} (${v.Id})`);
    }

    private _isJobFinished(d: any) {
        return d.ActualDeliveryTime && [2, 3, 4].indexOf(d.Status) > -1;
    }

    private _isJobOngoing(d: any) {
        return !d.ActualDeliveryTime && [1, 5].indexOf(d.Status) > -1;
    }

    private _updateRecentDelivery(src: any, d: any) {
        if (this._isJobFinished(d)) {
            if (!src.recent) {
                src.recent = d;
            } else {
                if (src.recent.ActualDeliveryTime < d.ActualDeliveryTime) {
                    src.recent = d;
                }
            }
        }
    }

    private _updateNextDelivery(src: any, d: any) {
        if (this._isJobOngoing(d)) {
            if (!src.next) {
                src.next = d;
            } else {
                if (src.next.EngineRouteSeqNum > d.EngineRouteSeqNum) {
                    src.next = d;
                }
            }
        }
    }
}
