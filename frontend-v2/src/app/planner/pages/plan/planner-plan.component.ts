
import { Component, HostListener, OnInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TdLoadingService } from '@covalent/core/loading';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { Problem } from '@app/vrp-basic/classes/problem';
import * as isSameDay from 'date-fns/is_same_day';

import { VrpFileService } from '@app/vrp-common';
import { VrpProblemRestService } from '@app/vrp-basic';
import { VrpSolutionDetailComponent } from '@app/vrp-common/pages/solution-detail/vrp-solution-detail.component';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpUserGroupRestService } from '@app/vrp-common/services/user-group-rest.service';
import { VrpUserRestService } from '@app/vrp-common/services/user-rest.service';
import { PLANNER_OPTIMIZATION_CONFIG, PLANNING_VEHICLE_SELECTION_CONFIG, PLANNING_ORDER_SELECTION_CONFIG } from '@app/planner/planner.config';

function isBelongToUserGroup(t: any, usergroup: string): boolean {
    const targetUserGroup = t.usergroup || t.UserGroup;
    if (!usergroup) {
        return !targetUserGroup;
    } else {
        return targetUserGroup ? (usergroup.toUpperCase() === targetUserGroup.toUpperCase()) : false;
    }
}

@Component({
    selector: 'vrp-planner-plan',
    templateUrl: './planner-plan.component.html',
    styleUrls: ['./planner-plan.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class PlannerPlanComponent implements OnInit, OnDestroy {

    private _isFirstLoad: boolean = true;
    private _subscriptions: Subscription[] = [];

    @ViewChild('vrpSolution') vrpSolution: VrpSolutionDetailComponent;

    viewDate: Date = new Date();

    innerHeight: number = 300;
    problem: Problem;
    deliveryDetails: any[] = [];

    selectedSol: any = undefined;

    toolbarDropdownMenu: any[] = [
        { label: 'Export to JSON (debug)', icon: 'file_download', click: () => this.exportProblem('json') },
    ];

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _plannerRest: PlannerRestService,
        private _plannerData: PlannerDataService,
        private _dialog: PlannerDialogService,
        private _loading: TdLoadingService,
        private _problemRest: VrpProblemRestService,
        private _file: VrpFileService,
        private _authentication: VrpAuthenticationService,
        private _userGroupRest: VrpUserGroupRestService,
        private _userRest: VrpUserRestService,
    ) {
        this._plannerData.addListeners(['DeliveryPlan']);
        this._route.queryParams.subscribe((params: any) => {
            if (params.viewDate) {
                this.changeViewDate(new Date(params.viewDate || Date.now()));
            }
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.innerHeight = window.innerHeight - 65;
    }

    ngOnInit() {
        this.onResize();
        const planObject = this._plannerData.DeliveryPlan;
        this._subscriptions = [
            planObject.data$.subscribe((p) => {
                this.problem = p;
                console.log('PlannerPlanComponent -> ngOnInit -> DeliveryPlan:get', this.problem);
            }),
        ];
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    changeQueryParams(params: any): void {
        this._router.navigate([], { queryParamsHandling: 'merge', queryParams: params });
    }

    changeViewDate(date: Date) {
        if (!isSameDay(date, this.viewDate) || this._isFirstLoad) {
            this._plannerData.setDeliveryPlanCachedObject(date, true);
            this._isFirstLoad = false;
            this.viewDate = date;
        }
    }

    openDateSelection() {
        this._dialog.openDateSelection(this.viewDate).subscribe((d: any) => {
            if (d && d instanceof Date) {
                this.changeQueryParams({ viewDate: d.toISODate(), solutionIndex: -1, routeIndex: -1 });
            }
        });
    }

    refresh() {
        this._dialog.confirm('REFRESH_CHANGES_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._plannerData.DeliveryPlan.refresh();
                this.vrpSolution.navSettings.selected = [];
            }
        });
    }

    exportProblem(extension: string = 'json' || 'xlsx') {
        const fileName = `${this.problem.name || this.problem._id}.${extension}`;
        // if (extension === 'json') {
        this._file.saveAsJson(this.problem, fileName);
        // } else {
        //     let wb = this._excel.jsonToExcelFile(this.problem, this.tableConfigs, fileName);
        // }
    }

    approveSolution(sol: any): void {
        console.log('approveSolution', sol);

        this._dialog.confirm('PLANNER_PLAN.APPROVE_SOLUTION_CONFIRM_MSG')
            .subscribe((yes) => {
                if (yes) {
                    this._loading.register('planner-plan.load');
                    this._plannerRest.approvePlan(sol).pipe(
                        finalize(() => this._loading.resolve('planner-plan.load')),
                    ).subscribe(() => {
                        sol.approved = { action: true, approvedTime: new Date() };
                        this._problemRest.updateItem(this.problem._id, 'solutions', sol.id, sol).subscribe((res) => {
                            Object.assign(this.problem, res);
                            this._dialog.alert('PLANNER_PLAN.SOLUTION_APPROVED_MSG');
                        }, (err) => this._dialog.errorResponse(err));

                    }, (err) => this._dialog.errorResponse(err));
                }
            });
    }

    async createOptimalSolution(initialSol: any = undefined, withTurnOverTime: boolean = false) {
        let orders = [...this.problem.shipments, ...this.problem.services].filter((o) => this._isOrderUnassigned(o));
        const drivers = await this._userRest.getAllDriverUsers().toPromise();
        const disabledDrivers = drivers.filter((d) => d.disabled);
        let vehicles = [...this.problem.vehicles].filter((v) => !disabledDrivers.find((d) => d.username.toUpperCase() === v.driver_name.toUpperCase()));
        let turnOverTime;
        let usergroup = this._authentication.getUserGroup();

        const preOptDialogConfig = [];

        if (this._authentication.isPowerPlanner()) { // if power planner, ask usergroup to be optimized first
            const usergroups = await this._userGroupRest.getAllUserGroups().toPromise();
            const usergroupNames = usergroups.map((u) => u.usergroup.toUpperCase());
            const selections = [undefined, ...usergroupNames];
            const selectionLabels = ['No Usergroup', ...usergroupNames];
            preOptDialogConfig.push({ name: 'usergroup', label: 'Select Usergroup', type: 'select', selections, selectionLabels });
        }

        if (withTurnOverTime) { // add options for turn over time
            preOptDialogConfig.push({ name: 'turnOverTime', label: 'Turn-over duration between two trips (min)', type: 'number', min: 5, max: 60, default: 30 });
        }

        if (preOptDialogConfig.length > 0) {
            const answer = await this._dialog.openDynamicEdit(preOptDialogConfig, undefined, undefined).toPromise();
            if (answer) {
                orders = orders.filter((o) => isBelongToUserGroup(o, answer.usergroup));
                vehicles = vehicles.filter((o) => isBelongToUserGroup(o, answer.usergroup));
                turnOverTime = answer.turnOverTime;
                usergroup = answer.usergroup;
            } else {
                return; // cancel button
            }
        }

        this.vrpSolution.optimizeWithDialog(orders, vehicles, initialSol, turnOverTime, {
            optimizationConfig: PLANNER_OPTIMIZATION_CONFIG,
            vehicleColumns: PLANNING_VEHICLE_SELECTION_CONFIG,
            orderColumns: PLANNING_ORDER_SELECTION_CONFIG,
        }, usergroup);
    }

    onOptimizationEnd(sol) {
        if (sol) {
            this._dialog.alert('PLANNER_PLAN.OPTIMIZATION_FINISHED_MSG');
        }
    }

    openOrderDetailById(orderId: string) {
        this._dialog.openOrderDetailById(orderId, true);
    }

    private _isOrderUnassigned(order) {
        return !order.assigned_to;
    }
}
