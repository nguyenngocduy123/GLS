import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { PlannerJobQuery } from '@app/planner/classes/planner-job-query';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import * as isSameDay from 'date-fns/is_same_day';

import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-monitor',
    templateUrl: './planner-monitor.component.html',
    styleUrls: ['./planner-monitor.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PlannerMonitorComponent implements OnInit, OnDestroy {

    private _subscriptions: Subscription[] = [];

    protected timeFilter: { start: string, end: string } = { start: '', end: '' };

    jobQuery: PlannerJobQuery;

    innerHeight: number = 300;
    viewTab: 'progress' | 'tracking' = 'progress';

    deliveryMasters: any[];
    vehicleDetails: any[];

    changedRoutes: any[] = [];
    unassignedOrderIds: string[] = [];

    tabList: any[] = [{ name: 'progress', label: 'Progress' }, { name: 'tracking', label: 'Tracking' }];

    allowFutureDateChange: boolean = true;
    allowPastDateChange: boolean = true;
    allowTimeFilter: boolean = true;
    readOnly: boolean = false;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _plannerRest: PlannerRestService,
        private _dialog: PlannerDialogService,
        private _plannerData: PlannerDataService,
    ) {
        this.jobQuery = new PlannerJobQuery({ startDate: new Date(), endDate: new Date(), finishedJob: false });
        this._route.queryParams.subscribe((params: any) => {
            if (params.viewDate) {
                this._plannerData.setDeliveryPlanCachedObject(new Date(params.viewDate || Date.now()), true);
            }
        });
        this._plannerData.addListeners(['DeliveryMaster', 'DeliveryPlan', 'DeliveryDetail', 'Message']);
    }

    ngOnInit() {
        let firstLoad: boolean = true;
        this.viewTab = (this._router.url.includes('tracking')) ? 'tracking' : 'progress';
        this._router.events.pipe(filter((event) => event instanceof NavigationStart)).subscribe((event: NavigationStart) => {
            this.viewTab = (event.url.includes('tracking')) ? 'tracking' : 'progress';
        });

        this._route.queryParams.subscribe((params: any) => {
            if (params.timeFilter) {
                const tf: string[] = params.timeFilter.split('-');
                this.timeFilter = { start: tf[0], end: tf[1] };
            }

            if (params.viewDate && !isSameDay(params.viewDate, this.jobQuery.startDate)) {
                this.jobQuery.startDate = new Date(params.viewDate);
                this.jobQuery.endDate = new Date(params.viewDate);
                this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);
                if (firstLoad) {
                    this._plannerData.Vehicle.getData$();
                }
            } else if (firstLoad) {
                this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);
                this._plannerData.Vehicle.getData$();
            }
            firstLoad = false;
        });

        this._plannerData.onPlanChanged.subscribe((sol: any) => {
            this.changedRoutes = sol.routes.filter((r) => r.isChanged);
            console.log('PlannerMonitorComponent -> ngOnInit -> this.changedRoutes', this.changedRoutes);
            this.unassignedOrderIds = this.unassignedOrderIds.concat(sol.unassignedOrderIds); // combining unassignedOrderIds of multiple tasks on dispatch screen
            this.unassignedOrderIds = this.unassignedOrderIds.filter((m) => !sol.movedOrderIds.includes(m)); // filters out orders pushed to assigned group from 'unassignedOrderIds'in subsequest tasks
        });

        this._subscriptions = [
            this._plannerData.DeliveryPlan.data$.subscribe((s) => this.refresh()),
            this._plannerData.dispatchPanelToggled$.subscribe((opened) => {
                this.allowFutureDateChange = !opened;
                this.allowPastDateChange = !opened;
                this.allowTimeFilter = !opened;
                this.readOnly = opened;
            }),
        ];
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    openDateSelection() {
        this._dialog.openDateSelection(this.jobQuery.startDate).subscribe((d: any) => {
            if (d && d instanceof Date) {
                this.changeQueryParams({ viewDate: d.toISODate() });
            }
        });
    }

    changeQueryParams(queryParams: any) {
        if (this.changedRoutes && this.changedRoutes.length > 0) {
            this._dialog.confirm('PLANNER_MONITOR.UNSAVES_CHANGES_CONFIRM_MSG').subscribe((answer) =>
                this._router.navigate([], { queryParamsHandling: 'merge', queryParams }));
        } else {
            this._router.navigate([], { queryParamsHandling: 'merge', queryParams });
        }
    }

    approvePlan() {
        const routes = this.changedRoutes.map((r) => Object.assign({ start_time: this.jobQuery.startDate, end_time: this.jobQuery.startDate }, r.toMongoJSON()));
        console.log('PlannerMonitorComponent -> approvePlan -> routes', routes);
        const warningMsg = `Please confirm the following changes:\n  ${this.unassignedOrderIds.length} order(s) to be unassigned:.\n ${routes.length} route(s) to be modified`;
        this._dialog.confirm(warningMsg).subscribe((answer) => {
            if (answer) {
                this._plannerRest.approvePlan({ routes, unassigned_jobs: this.unassignedOrderIds }).subscribe((res) => {
                    this.changedRoutes.forEach((r) => r.isChanged = false);
                    this.changedRoutes = [];
                    this.unassignedOrderIds = [];

                    this._dialog.alert('PLANNER_MONITOR.PLAN_CHANGE_SAVE');
                }, (err) => {
                    this._dialog.errorResponse(err);
                });
            }
        });
    }

    refresh(event: any = undefined) {
        if (event) {
            this._resetChanges('REFRESH_CHANGES_CONFIRM_MSG');
        } else {
            this._refresh();
        }
    }

    discardChanges() {
        this._resetChanges('PLANNER_MONITOR.DISCARD_CHANGES_CONFIRM_MSG');
    }

    applyTimeFilter(timeFilter: any) {
        this._router.navigate([], { queryParamsHandling: 'merge', queryParams: { timeFilter: `${timeFilter.start}-${timeFilter.end}` } });
    }

    _resetChanges(msg: string) {
        this._dialog.confirm(msg).subscribe((yes) => {
            if (yes) {
                this.changedRoutes.forEach((r) => r.isChanged = false);
                this.changedRoutes = [];
                this.unassignedOrderIds = [];
                this._refresh();
            }
        });
    }

    _refresh() {
        this._plannerData.Vehicle.refresh();
        this._plannerData.DeliveryDetail.refresh();
    }
}
