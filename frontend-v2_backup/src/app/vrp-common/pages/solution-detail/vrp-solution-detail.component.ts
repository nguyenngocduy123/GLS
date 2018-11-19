import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VrpExcelService, VrpFileService, VrpWebsocketService } from '@app/vrp-common';
import { VrpLeafletComponent, IVrpLegend, VrpMapUtils } from '@components/vrp-leaflet';
import { IVrpNavListSettings } from '@components/vrp-navlist';
import * as format from 'date-fns/format';
import { remove as _remove } from 'lodash-es';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

import { Problem } from '@app/vrp-basic/classes/problem';
import { VrpBasicJobMarker } from '@app/vrp-basic/classes/vrp-basic-job-marker';
import { VrpBasicPath } from '@app/vrp-basic/classes/vrp-basic-path';
import { VrpBasicStationMarker } from '@app/vrp-basic/classes/vrp-basic-station-marker';
import { VrpBasicDialogService } from '@app/vrp-basic/services/basic-dialog.service';
import { VrpProblemRestService } from '@app/vrp-basic/services/problem-rest.service';
import { VrpOptimizationSettingsDialogComponent } from '@app/vrp-basic/dialogs/optimization-settings/optimization-settings-dialog.component';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-solution-detail',
    templateUrl: './vrp-solution-detail.component.html',
    styleUrls: ['./vrp-solution-detail.component.scss'],
})
export class VrpSolutionDetailComponent implements OnInit, AfterViewInit, OnChanges {

    @ViewChild('leafletMap') vrpLeaflet: VrpLeafletComponent;

    legends: IVrpLegend[] = [
        { className: 'blank-marker-icon station', checked: true, disabled: false, text: 'Stations', toggle: () => this._visualizeVehicles() },
        { className: 'blank-marker-icon blue', checked: true, disabled: false, text: 'Assigned Jobs', toggle: () => this._visualizeAssignedJobs() },
        { className: 'blank-marker-icon grey', checked: true, disabled: false, text: 'Unassigned Jobs', toggle: () => this._visualizeUnassignedJobs() },
    ];

    @ViewChild('navList') navList;

    @ViewChild('solutionItemTemplate') solutionItemTemplate;
    @ViewChild('routeItemTemplate') routeItemTemplate;
    @ViewChild('actItemTemplate') actItemTemplate;
    @ViewChild('footerTemplate') footerTemplate;

    @Input() problem: Problem;

    @Output() onCreateSolutionWithInitial: EventEmitter<any> = new EventEmitter();
    @Output() onCreateSolutionWithTurnOver: EventEmitter<any> = new EventEmitter();
    @Output() onSolutionsChanged: EventEmitter<any> = new EventEmitter();
    @Output() onSolutionOpened: EventEmitter<any> = new EventEmitter();
    @Output() onOptimizationEnd: EventEmitter<any> = new EventEmitter();
    @Output() onJobDetailsOpened: EventEmitter<string> = new EventEmitter();

    solIndex: number = -1;
    routeIndex: number = -1;

    mSolution: any;
    mRoute: any;
    mRoutes: any[];

    navSettings: any;
    navData: any[] = [];
    footerData: any[] = [];

    solutionListSettings: IVrpNavListSettings = {
        title: 'Solutions', numbering: false, selected: [], dense: false,
        filter: (searchString, d) => ('' + d.id).search(new RegExp(searchString, 'i')) > -1,
        itemTemplateRef: () => this.solutionItemTemplate,
        footerTemplateRef: () => { },
        headerMenuActions: [
            { label: 'Import from JSON', click: () => this._importSolution('json') },
            { label: 'Delete Selected Solution', click: () => this._deleteSelectedSol() },
        ],
        itemMenuActions: [
            { label: 'Open', click: (d) => this.changeQueryParams({ solutionIndex: this.problem.solutions.indexOf(d) }) },
            { label: 'Delete', click: (d) => this._deleteItems([d]) },
            { label: 'Rename', click: (d) => this._renameSolution(d) },
            { label: 'Reoptimize (preserve routes)', click: (d) => this.onCreateSolutionWithInitial.emit(d) },
            { label: 'Reoptimize (add turnover duration)', click: (d) => this.onCreateSolutionWithTurnOver.emit(d) },
            { label: 'Export to JSON', click: (d) => this._exportSolution(d, 'json') },
            { label: 'Export to Excel', click: (d) => this._exportSolution(d, 'xlsx') },
        ],
    };

    routeListSettings: IVrpNavListSettings = {
        title: 'Routes', numbering: false, selected: [], dense: false, summaryText: undefined,
        headerActions: [
            { label: 'Go back', icon: 'arrow_back', click: () => this.changeQueryParams({ solutionIndex: -1 }) },
        ],
        filter: (searchString, d) => {
            return (d.tags.vehicle_id + d.tags.driver_name || '').search(new RegExp(searchString, 'i')) > -1;
        },
        itemTemplateRef: () => this.routeItemTemplate,
        footerTemplateRef: () => this.footerTemplate,
        itemMenuActions: [
            { label: 'Open', click: (d, i) => this.changeQueryParams({ routeIndex: i }) },
            { label: 'Delete', click: (d) => this._deleteItems([d]) },
        ],
        itemClick: (d) => { if (d.checked) { d.highlight(); } },
        itemSelect: (d, all) => this.onRouteSelected(d, all),
    };

    actListSettings: IVrpNavListSettings = {
        title: 'Activities', numbering: true,
        summaryText: undefined,
        headerActions: [
            { label: 'Go back', icon: 'arrow_back', click: () => this.changeQueryParams({ routeIndex: -1 }) },
        ],
        filter: (searchString, d) => ('' + d.tags.id).search(new RegExp(searchString, 'i')) > -1,
        itemTemplateRef: () => this.actItemTemplate,
        footerTemplateRef: () => { },
        itemClick: (d) => d.openPopup(),
        // itemMenuActions: [
        // 	{ label: 'Delete', click: (d) => this._deleteItems([d]) },
        // ],
    };

    constructor(
        private _dialog: VrpBasicDialogService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _excel: VrpExcelService,
        private _file: VrpFileService,
        private _problemRest: VrpProblemRestService,
        private _socket: VrpWebsocketService,
        private _toast: VrpToastService,
    ) {
        this.navSettings = this.solutionListSettings;
    }

    ngOnInit() {
        this._route.queryParams.subscribe((p: any) => {
            if (p.solutionIndex) {
                this.solIndex = p.solutionIndex;
            }

            if (p.routeIndex) {
                this.routeIndex = p.routeIndex;
            }

            this.openSolution();
        });
    }

    ngAfterViewInit() {
        this.load();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.problem && !changes.problem.firstChange) {
            this.load();
        }
    }

    changeQueryParams(params: any) {
        this._router.navigate([], { queryParamsHandling: 'merge', queryParams: params });
    }

    load() {
        if (this.vrpLeaflet && this.vrpLeaflet.isInitialized) {
            this.renderProblem();
            this.openSolution();
            this.vrpLeaflet.invalidateSize().fitBounds(); // update map and show everything
        }
    }

    renderProblem() {
        if (this.problem) {
            console.log('VrpSolutionDetailComponent -> renderProblem -> this.problem', this.problem);
            const totalJobs: number = this.problem.services.length + this.problem.shipments.length;

            if (totalJobs > 1000) {
                this.vrpLeaflet.clusteringMode = true;
            }
            this.vrpLeaflet.remove(); // remove everything

            this.problem.services.forEach((s, i) => {
                try {
                    const mService = new VrpBasicJobMarker(s);
                    // console.log('VrpSolutionDetailComponent -> renderProblem -> mService', mService, s, i);
                    if (mService.isLatLngValid()) {
                        this.vrpLeaflet.add(mService);
                    }
                } catch (err) {
                    console.error(err);
                }
            });

            console.log(this.vrpLeaflet.select());

            this.problem.shipments.forEach((s) => {
                try {
                    const mPickup = new VrpBasicJobMarker(s, 'pickup');
                    this.vrpLeaflet.add(mPickup);
                    const mDelivery = new VrpBasicJobMarker(s, 'delivery');
                    this.vrpLeaflet.add(mDelivery);
                } catch (err) {
                    console.error(err);
                }
            });

            this.problem.solutions.forEach((s) => s.checked = false);

            this._visualizeUnassignedJobs();

        }
    }

    _createRoute(routeData: any, routeId: string): VrpBasicPath {
        const markers = routeData.act.map((a) => {// set job markers
            if (a.type === 'pickupShipment') {
                a.type = 'pickup';
            } else if (a.type === 'deliverShipment') {
                a.type = 'delivery';
            }
            return a;
        }).filter((a) => ['pickup', 'delivery'].includes(a.type))
            .map((a) => {
                const m: any = this.vrpLeaflet.get(`${a.job_id}_${a.type}`);
                if (m) {
                    m.arrivalTime = { start: a.arr_time, end: a.end_time };
                    m.routeId = routeId;
                    m.solutionId = this.mSolution.id;
                    m.updateMarker();
                } else {
                    console.warn(' VrpSolutionDetailComponent -> createRoute -> Cant find markers on map for act', a);
                }
                return m;
            }).filter((m) => m); // get markers along path

        // set start and stop markers
        const color: string = VrpMapUtils.getRandomColor();

        const vehicleData = this.problem.vehicles.find((t) => t.id === routeData.vehicle_id);
        routeData.driver_name = vehicleData.driver_name;
        routeData.max_num_job = vehicleData.max_num_job;

        const vehicleTypeData = this.problem.vehicle_types.find((vt) => vt.id === vehicleData.type_id);
        routeData.vehicle_capacity = vehicleTypeData.capacity;

        const startMarker = new VrpBasicStationMarker(routeId, color, { address: vehicleData.start_address });
        let stopMarker;
        if (vehicleData.return_to_depot && vehicleData.end_address) {
            stopMarker = new VrpBasicStationMarker(routeId, color, { address: vehicleData.end_address });
        }

        const r: VrpBasicPath = new VrpBasicPath(routeId || routeData.id, startMarker, markers, stopMarker, color, routeData);
        r.checked = true;

        this.vrpLeaflet.add([startMarker, r]);
        return r;
    }

    _removeAllRoutes() {
        if (this.mRoutes) {
            this.mRoutes.forEach((route) => {
                if (route.vehicleMarker) {
                    route.vehicleMarker.routeId = undefined;
                }

                if (route.markers) {
                    route.markers.forEach((m) => {
                        m.arrivalTime = undefined;
                        m.routeId = undefined;
                        m.updateMarker();
                    });
                }
            });

            this.vrpLeaflet.remove((l) => l instanceof VrpBasicPath || l instanceof VrpBasicStationMarker);
        }
    }

    openSolution() {
        if (this.vrpLeaflet && this.vrpLeaflet.isInitialized && this.problem) {
            console.log('VrpSolutionDetailComponent -> openSolution -> this.mSolution', this.mSolution);
            if (this.solIndex >= 0 && this.problem.solutions[this.solIndex]) {
                const selectedSol = this.problem.solutions[this.solIndex];

                if (this.vrpLeaflet && this.mSolution !== selectedSol) { // view details of a solution
                    this.mSolution = selectedSol;

                    this.routeListSettings.title = this.mSolution.id;
                    this.routeListSettings.summaryText = `Total Cost: $${this.mSolution.costs.toFixed(1)}, ${(this.mSolution.distance / 1000).toFixed(1)} km`; // update summary text
                    this._updateSolutionIdUnassignedJobs();
                    this.mRoutes = this.mSolution.routes.map((r, i) => this._createRoute(r, `R_${r.vehicle_id}_${i}`)); // update routes
                }

                if (this.routeIndex < 0) { // view all routes
                    this.mRoute = undefined;
                    this.vrpLeaflet.highlightOff();

                    // == update navList
                    this.navData = this.mRoutes;
                    this.navSettings = this.routeListSettings;
                    this.footerData = this._addFooter();

                } else { // view a specific route
                    this.footerData = [];
                    this.mRoute = this.mRoutes[this.routeIndex];
                    this.mRoute.checked = true;
                    this.legends[1].checked = true; // set to view assigned jobs
                    this.mRoute.highlight();
                    // == update navList

                    let prevM;
                    this.mRoute.markers.forEach((m) => {
                        if (!prevM || prevM.getAddress().id !== m.getAddress().id || prevM.jobType !== m.jobType) {// not same location
                            m._subHeader = `${m.jobType.toUpperCase()} at ${m.getTextAddress()}`;
                        } else {
                            m._subHeader = undefined;
                        }
                        prevM = m;
                    });

                    this.navData = this.mRoute.markers;
                    this.actListSettings.title = this.mRoute.tags.vehicle_id;
                    this.actListSettings.summaryText = this.mRoute.tags && `Distance: ${(this.mRoute.tags.distance / 1000).toFixed(1)} km, start at ${format(this.mRoute.tags.start_time, 'HH:mm')}, end at  ${format(this.mRoute.tags.end_time, 'HH:mm')}`;

                    this.navSettings = this.actListSettings;
                }

                this.legends[0].disabled = false;
                this.legends[1].disabled = false;
                this._visualize();

            } else { // view all solutions
                this.footerData = [];
                this._removeAllRoutes();

                this.navData = this.problem.solutions;
                this.navSettings = this.solutionListSettings;
                this.mSolution = undefined;
                this.mRoutes = undefined;
                this.mRoute = undefined;

                this.legends[0].disabled = true;
                this.legends[1].disabled = true;
                this._visualize();
            }
            this.onSolutionOpened.emit(this.mSolution);
        }
    }

    onRouteSelected(route, all) {
        const layersWithMarkers: any[] = [route, route.vehicleMarker, ...route.markers];
        this._visualize(layersWithMarkers);
        if (route.checked && !all) {
            route.highlight();
        }
    }

    optimizeWithDialog(selectableOrders, selectableVehicles, initialSol, turnOverTime, config: any = {}, usergroup: string = undefined) {
        if (selectableOrders.length === 0) {
            this._dialog.alert('There are no pending orders');
        } else if (selectableVehicles.length === 0) {
            this._dialog.alert('There are no usable vehicles to assign orders to');
        } else {
            this._dialog.openWithConfig(VrpOptimizationSettingsDialogComponent, {
                maxWidth: '100vw',
                maxHeight: '100vh',
                data: {
                    selectableOrders,
                    selectableVehicles,
                    problem: this.problem,
                    initialSol,
                    turnOverTime,
                    config,
                },
            }).subscribe((options) => {
                if (options) {
                    options.isSaved = true; // allow server to save solution
                    options.usergroup = usergroup;
                    this.optimize(options);
                }
            });
        }
    }

    optimize(options) {
        console.log('VrpSolutionDetailComponent -> optimize -> options', options);
        const msgSubject: Subject<string> = new Subject();
        const snackBar = this._dialog.openLoadingSnackBar(msgSubject);
        msgSubject.next('Optimizing ...');

        this._socket.onJSON('msg', (msg) => { // listen message from socket and show on waiting dialogs
            console.log('VrpSolutionDetailComponent -> optimize -> msg', msg);
            if (msg.data && msg.data[0]) {
                const msgStr = 'Optimizing: ' + msg.data[0].replace(/[^a-z0-9: \/]/gi, '');
                msgSubject.next(msgStr);
            }
        });

        // options.problem = this.problem.createAbstractInstance(options.selectedVehicleIds, options.selectedOrderIds);

        const optObserver = this._problemRest.optimize(this.problem._id, options).pipe(
            finalize(() => {
                snackBar.dismiss();
                this._socket.removeListener('msg');
            }),
        ).subscribe((sol) => {
            if (!sol || sol.routes.length === 0) { // if no solution obtained
                this._dialog.alert('OPTIMIZATION_ERROR_ALERT'); // alert error
            } else {
                this.onOptimizationEnd.emit(sol);
            }

            if (!sol) { return; } // skip processing

            const i = this.problem.solutions.findIndex((s) => s.id === sol.id);
            if (i > -1) { // update solutions to the list
                this.problem.solutions.splice(i, 1, sol);
            } else {
                this.problem.solutions.push(sol);
            }
            this.navList.filter();
        }, (err) => this._dialog.closeAll().errorResponse(err));

        snackBar.onAction().subscribe(() => {// if user click cancel
            optObserver.unsubscribe(); // cancel the request
            this._dialog.alert('SOLUTION_DETAIL.OPTIMIZATION_CANCELLED_ALERT');
        });

    }

    private _renameSolution(d) {
        this._dialog.prompt(d.id).subscribe((newId) => {
            if (newId) {
                const oldId: string = d.id;
                d.id = newId;
                this._problemRest.updateItem(this.problem._id, 'solutions', oldId, d).subscribe(() => {
                    this._toast.shortAlert('Renamed succesfully');
                }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    private _importSolution(fileType: string = 'json') {
        this._file.open({ accept: fileType, type: 'text' }, (jsonString) => {
            try {
                const json = JSON.parse(jsonString);
                this.problem.solutions.push(json);
                this.navList.filter();
                this._toast.shortAlert('SOLUTION_DETAIL.IMPORT_SUCCESS_MSG');
            } catch (e) {
                this._dialog.error(e, 'INVALID_FILE_FORMAT_ERR');
            }
        });
    }

    private _exportSolution(solution: any, fileType: string = 'json') {
        if (fileType === 'json') {
            this._file.saveAsJson(solution, `${solution.id}.json`);
        } else if (fileType === 'xlsx') {
            const wb = this._excel.addCSVToWorkbook(undefined, this.problem.exportSolSummaryToCSV(solution), 'Solution', [30, 20, 15, 15, 15, 7, 20, 20, 20]);
            this._excel.addCSVToWorkbook(wb, this.problem.exportAllRoutesToCSV(solution.routes), 'Routes', [9, 20, 7, 13, 13, 12, 12, 7, 50, 30, 15, 15]);
            this._excel.saveWorkbookToFile(wb, `${solution.id}.xlsx`);
        }
    }

    private _deleteSelectedSol() {
        const selectedSol = this.problem.solutions.filter((c) => c.checked);
        this._deleteItems(selectedSol);
    }

    private _deleteItems(selected: any[]) {
        if (selected.length > 0) {
            this._dialog.confirm('SOLUTION_DETAIL.DELETE_PROCESS_CONFIRM_ALERT').subscribe((yes) => {
                if (yes) {

                    this._problemRest.deleteItems(this.problem._id, 'solutions', selected.map((s) => s.id)).subscribe((answer) => {
                        console.log('_deleteItems -> answer', answer);
                        const removedItems = _remove(this.navData, (s) => selected.includes(s));
                        if (removedItems.length > 0) {
                            this.navList.filter();
                        }
                        this._toast.shortAlert(`${removedItems.length} records has been deleted`);
                        // this.onSolutionsChanged.emit('changed');
                    }, (err) => this._dialog.errorResponse(err));
                }
            });
        }
    }

    private _visualizeVehicles() {
        const selectedLayers = this.vrpLeaflet.select((l) => l instanceof VrpBasicStationMarker);
        this._visualize(selectedLayers);
    }

    private _visualizeAssignedJobs() {
        const selectedLayers = this.vrpLeaflet.select((l) => l instanceof VrpBasicJobMarker && !l.isUnassignedJob());
        this._visualize(selectedLayers);
    }

    private _visualizeUnassignedJobs() {
        const selectedLayers = this.vrpLeaflet.select((l) => l instanceof VrpBasicJobMarker && l.isUnassignedJob());
        this._visualize(selectedLayers);
    }

    private _visualize(_layers: any[] = undefined) {
        const layers: any[] = _layers ? _layers : this.vrpLeaflet.select({});
        const selectedRouteIds: string[] = this.mRoute ? [this.mRoute.id] : (this.mRoutes ? this.mRoutes.filter((r) => r.checked).map((v) => v.id) : []);

        let showLayers: any[] = layers.filter((m) => {
            if (m instanceof VrpBasicJobMarker) {
                if (this.legends[m.isUnassignedJob() ? 2 : 1].checked) {
                    return m.isUnassignedJob() ? true : selectedRouteIds.includes(m.routeId);
                } else {
                    return false;
                }
            } else if (m instanceof VrpBasicStationMarker) {
                return this.legends[0].checked && selectedRouteIds.includes(m.routeId);
            } else if (m instanceof VrpBasicPath) {
                if (this.mRoute) {
                    return this.mRoute === m;
                } else {
                    return m.checked;
                }
            }
            return false;
        });

        // display only selected solution's jobs
        if (this.mSolution && this.mSolution.id) {
            const unselectedJobLayers = this.vrpLeaflet.select((l) => l instanceof VrpBasicJobMarker && !l.isSelectedSolutionJob(this.mSolution.id));
            showLayers = showLayers.filter((m) => !unselectedJobLayers.includes(m));
        }

        const hideLayers: any[] = layers.filter((m) => !showLayers.includes(m));
        this.vrpLeaflet.showLayers(showLayers);
        this.vrpLeaflet.hideLayers(hideLayers);
    }

    private _updateSolutionIdUnassignedJobs() {
        if (this.mSolution.unassigned_jobs.length > 0) {
            this.mSolution.unassigned_jobs.forEach((jobId) => {
                ['pickup', 'delivery'].forEach((type) => {
                    const m: any = this.vrpLeaflet.get(`${jobId}_${type}`);
                    if (m) {
                        m.solutionId = this.mSolution.id;
                        m.updateMarker();
                    }
                });
            });
        }
    }

    private _addFooter(): any[] {
        const footerData = [];

        if (this.mSolution.unassigned_jobs && this.mSolution.unassigned_jobs.length > 0) {
            footerData.push({
                title: `Unassigned Jobs (${this.mSolution.no_unassigned_jobs})`,
                value: { subHeader: 'Order', reason: this.mSolution.unassigned_reasons },
            });
        }

        if (this.mSolution.ignored) {
            if (this.mSolution.ignored.jobs) {
                footerData.push({
                    title: `Ignored Jobs (${this.mSolution.no_ignored_jobs})`,
                    value: { subHeader: 'Order', reason: this.mSolution.ignored.jobs.reasons },
                });
            }
            if (this.mSolution.ignored.vehicles) {
                footerData.push({
                    title: `Ignored Vehicles (${this.mSolution.no_ignored_vehicles})`,
                    value: { subHeader: 'Vehicle', reason: this.mSolution.ignored.vehicles.reasons },
                });
            }
        }
        return footerData;
    }
}
