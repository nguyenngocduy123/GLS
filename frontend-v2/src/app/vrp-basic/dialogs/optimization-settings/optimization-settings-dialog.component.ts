import { Component, Inject, ViewChild, HostListener, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { pick as _pick } from 'lodash-es';
import * as addMinutes from 'date-fns/add_minutes';
import * as format from 'date-fns/format';

import { VrpUtils } from '@app/vrp-common';
import { ORDER_SELECTION_CONFIG, PROBLEMDETAIL_TABLE_CONFIG, OPTIMIZATION_CONFIG } from '@app/vrp-basic/vrp-basic.config';

export interface IVrpOptimizationDialogData {
    problem: any;
    selectableOrders: any[];
    selectableVehicles: any[];
    initialSol?: any;
    turnOverTime?: number;
    config?: { vehicleColumns: any[], orderColumns: any[], optimizationConfig: any[] };
}

@Component({
    selector: 'vrp-optimization-settings-dialog',
    templateUrl: './optimization-settings-dialog.component.html',
    styleUrls: ['./optimization-settings-dialog.component.scss'],
})
export class VrpOptimizationSettingsDialogComponent implements OnInit {

    private _optimizationConfig: any;
    private _preserveInitialRoutes: boolean = false;

    @ViewChild('orderTable') private _orderTable;
    @ViewChild('timeFilterMenu') private _timeFilterMenu;

    tableHeight: number;

    vehicleColumns: any[];
    vehicles: any[] = [];
    selectedVehicles: any[] = [];
    requiredVehicles: any[] = []; // list of vehicles that cannot be un-selected

    orderColumns: any[];
    orders: any[] = [];
    selectedOrders: any[] = [];
    orderIdsInSol: any[] = []; // list of order ids in solution (if any)

    title: string = 'Optimization';
    elements: any[] = [[]];
    form: any = {};

    tableOrderActions: any[] = [
        { label: 'Due Time Filter', menuTemplateRef: () => this._timeFilterMenu },
    ];

    selectedIndex: number = 0;

    constructor(
        private _dialogRef: MatDialogRef<VrpOptimizationSettingsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: IVrpOptimizationDialogData,
    ) {
        this.tableHeight = window.innerHeight - 110;
    }

    ngOnInit(): void {
        console.log('VrpOptimizationSettingsDialogComponent -> ngOnInit -> this._data', this._data);

        this.vehicleColumns = this._data.config.vehicleColumns || PROBLEMDETAIL_TABLE_CONFIG.vehicles;
        this.orderColumns = this._data.config.orderColumns || ORDER_SELECTION_CONFIG;
        this._optimizationConfig = this._data.config.optimizationConfig || OPTIMIZATION_CONFIG;

        this.orders = this._data.selectableOrders;
        this.vehicles = this._data.selectableVehicles;

        // check if it's for dynamic optimization
        if (this._data.initialSol) {
            const turnOverTime = this._data.turnOverTime;
            const initialSol = this._data.initialSol;

            if (!isNaN(turnOverTime)) {
                this.title = `Optimization - Vehicle Start Time derived from Solution ${initialSol.id}`;
            } else {
                this._preserveInitialRoutes = true; // if turnOverTime is not set => preserve initial route
            }

            const _vehicleIdsInSol = [];
            initialSol.routes.forEach((r) => { // get all jobs and vehicles existed in initial solution
                const vehicle = this.vehicles.find((v) => v.id === r.vehicle_id);
                if (vehicle) { // if vehicle found in existing routes
                    if (!isNaN(turnOverTime)) {
                        vehicle.earliest_start = format(addMinutes(r.end_time, turnOverTime), 'YYYY-MM-DDTHH:mm:ssZ');  // r.end_time + this._data.turnOverTime;
                    }
                    _vehicleIdsInSol.push(vehicle.id);
                }
                this.orderIdsInSol.push(...r.act.map((a) => a.job_id));
            });

            // exclude orders existing in initial solution from selection
            this.orders = this._data.selectableOrders.filter((o) => !this.orderIdsInSol.includes(o.id));

            // check if this dynamic optimization is meant for preserve route
            if (this._preserveInitialRoutes) {
                // force vehicles in initial solution to be selected (turnover allows original vehicles to be unselected)
                this.requiredVehicles = this._data.selectableVehicles.filter((v) => _vehicleIdsInSol.includes(v.id));
            }
        }

        this._selectAllOrdersAndVehicles();
        this._initSettingsForm();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 205;
    }

    close() {
        // get lists of configurations in form
        const configs = this._optimizationConfig.filter((s) => this.form[s.name]);

        // engine options needs to be root property
        const options = _pick(this.form, configs.filter((s) => !s.isConstraint).map((s) => s.name));

        // engine constraints needs to be in string with underscore delimiter
        options.constraints = configs.filter((s) => s.isConstraint).map((s) => s.name).join('_');

        options.problem = this._createAbstractInstance();

        if (this._preserveInitialRoutes) {// if initial solution is preserved
            if (options.engine === 'siwei') {
                options.dynamicSettings = { initialSolIndex: 0, mode: 3 };
            } else {
                options.dynamicSettings = { initialSolId: this._data.initialSol.id };
            }
        }

        console.log('VrpOptimizationSettingsDialogComponent -> close -> options', options);
        this._dialogRef.close(options);
    }

    cancel() {
        this._dialogRef.close();
    }

    applyDueTimeFilter(timeRange: any) {
        this.selectedOrders = VrpUtils.applyFilterToDateColumn(this.orders, 'dueTime', timeRange);
        this._orderTable.filter(this.selectedOrders);
        this.tableOrderActions[0].label = `Filtered (${timeRange.start} to  ${timeRange.end}) `;
    }

    private _selectAllOrdersAndVehicles() {
        this.selectedOrders = [...this.orders];
        this.selectedVehicles = [...this.vehicles];
    }

    private _initSettingsForm(): any {
        const isDynamicOptimization = !!(this._data.initialSol || this._data.turnOverTime);

        const arrayOfFormElements = [[]];
        this._optimizationConfig.forEach((e) => {
            const t: any = Object.assign({}, e);

            // check whether to hide option for dynamic optimisation
            if (!isDynamicOptimization || !t.hideForDynamic) {
                this.form[t.name] = t.default;
                const i = (e.rowIndex && e.rowIndex > 0) ? e.rowIndex : 0;

                if (!arrayOfFormElements[i]) {
                    arrayOfFormElements[i] = [];
                }
                arrayOfFormElements[i].push(t);
            }
        });

        if (!this.form.solutionId) {
            const today = new Date();
            this.form.solutionId = `s_${today.YYMMDD()}_${today.HHmmss('')}`;
        }

        this.elements = arrayOfFormElements;
    }

    private _createAbstractInstance() {
        const original = this._data.problem;
        const selectedOrderIds: string[] = this.selectedOrders.map((o) => o.id);
        const selectedVehicleIds: string[] = this.selectedVehicles.map((o) => o.id);

        const _p = Object.assign({
            vehicles: this.vehicles.filter((v) => selectedVehicleIds.includes(v.id)),
            services: original.services.filter((s) => s && selectedOrderIds.includes(s.id)),
            shipments: original.shipments.filter((s) => s && selectedOrderIds.includes(s.id)),
        }, _pick(this._data.problem, ['_id', 'coord_mode', 'fleet_size', 'items', 'username']));

        const usedVehicleTypeIds: string[] = _p.vehicles.map((v) => v.type_id);
        _p.vehicle_types = original.vehicle_types.filter((t) => usedVehicleTypeIds.includes(t.id));

        if (this._preserveInitialRoutes) {
            _p.solutions = [this._data.initialSol];

            const services = original.services.filter((s) => s && this.orderIdsInSol.includes(s.id));
            const shipments = original.shipments.filter((s) => s && this.orderIdsInSol.includes(s.id));
            _p.services = [..._p.services, ...services];
            _p.shipments = [..._p.shipments, ...shipments];
        }

        const usedAddressIds: string[] = [];
        [..._p.vehicles, ..._p.services, ..._p.shipments].forEach((s) => {
            ['start_address', 'end_address', 'address', 'pickup_address'].forEach((key) => {
                if (s[key] && s[key].id) {
                    usedAddressIds.push(s[key].id);
                }
            });
        });

        _p.addresses = original.addresses.filter((s) => s && usedAddressIds.includes(s.id));

        console.log('VrpOptimizationSettingsDialogComponent -> private_createAbstractInstance -> _p', _p);
        return _p;
    }
}
