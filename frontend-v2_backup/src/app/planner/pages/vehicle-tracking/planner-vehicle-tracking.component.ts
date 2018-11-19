import { AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { VrpExcelService, VrpUtils, VrpWebsocketService } from '@app/vrp-common';
import { IVrpNavListSettings } from '@components/vrp-navlist';
import { IVrpLegend, VrpLeafletComponent, VrpMapUtils } from '@components/vrp-leaflet';
import { PLAN_TABLE_CONFIG, STATUS_COLORS } from '@app/planner/planner.config';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { VrpBasicStationMarker } from '@app/vrp-basic/classes/vrp-basic-station-marker';
import { PlannerJobMarker } from '@app/planner/classes/planner-job-marker';
import { PlannerPath } from '@app/planner/classes/planner-path';
import { PlannerVehicleMarker } from '@app/planner/classes/planner-vehicle-marker';

@Component({
    selector: 'vrp-planner-vehicle-tracking',
    templateUrl: './planner-vehicle-tracking.component.html',
    styleUrls: ['./planner-vehicle-tracking.component.scss'],
})
export class PlannerVehicleTrackingComponent implements OnInit, OnDestroy, AfterViewInit {

    private _subscriptions: Subscription[] = [];

    protected timeFilter: { start: string, end: string } = { start: '', end: '' };

    readonly statusColors: any[] = STATUS_COLORS.map((c) => c.primary);

    readonly legends: IVrpLegend[] = [
        { className: 'blank-marker-icon truck-red', text: 'Vehicles', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon blue', text: 'Pending', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon orange', text: 'Late', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon green', text: 'Ontime', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon red', text: 'Unsuccesful', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon magenta', text: 'Expected Late', checked: true, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon grey', text: 'Unassigned', checked: false, toggle: (i) => this._toggleLegend(i) },
        { className: 'blank-marker-icon station', text: 'Stations', checked: true, toggle: (i) => this._toggleLegend(i) },
    ];

    @ViewChild('vehicleItemTemplate') vehicleItemTemplate;
    @ViewChild('actItemTemplate') actItemTemplate;
    @ViewChild('leafletMap') vrpLeaflet: VrpLeafletComponent;
    @ViewChild('navList') navList;
    @ViewChild('sideNavRight') sideNavRight;

    vehicles: any[] = [];

    unassignedJobMarkers: PlannerJobMarker[] = [];

    selectedVehicle: any;
    clickedVehicle: any;

    navSettings: any = {};
    navData: any[] = [];

    readonly vehicleListSettings: IVrpNavListSettings = {
        title: 'Vehicles', selected: [],
        // summaryText: () => `Total Cost: ${this.mSolution.costs}, Distance: ${this.mSolution.distance}`,
        filter: (searchString, d) => ('' + d.id + d.DriverUsername).search(new RegExp(searchString, 'i')) > -1,
        headerMenuActions: [
            { label: 'Export Plan', icon: 'file_download', click: (d) => this._exportPlanToExcel() },
        ],
        itemTemplateRef: () => this.vehicleItemTemplate,
        footerTemplateRef: () => {},
        itemMenuActions: [
            { label: 'Open', icon: 'launch', click: (d) => this.openVehicle(d) },
            { label: 'Edit Job Sequence', icon: 'edit', click: (d) => { this.clickedVehicle = d; this.toggleDispatchPanel(true); } },
            { label: 'Export to Excel', icon: 'file_download', click: (d) => this._exportPlanToExcel(d) },
        ],
        itemClick: (d) => { if (d.checked && d.route) { d.route.highlight(true); this.clickedVehicle = d; } },
        itemSelect: (d, all) => {
            this.visualizeVehicle(d); if (d.checked && d.route && !all) { d.route.highlight(true); }
        },
    };

    readonly actListSettings: any = {
        title: 'Activities', numbering: true,
        headerActions: [
            { label: 'Go back', icon: 'arrow_back', click: () => this.openVehicle() },
        ],
        filter: (searchString, d) => ('' + d.tags.DeliveryMasterId).search(new RegExp(searchString, 'i')) > -1,
        itemTemplateRef: () => this.actItemTemplate,
        itemClick: (d) => d.openPopup(),
    };

    innerHeight: number = 500;

    constructor(
        private _route: ActivatedRoute,
        private _dialog: PlannerDialogService,
        private _socket: VrpWebsocketService,
        private _plannerRest: PlannerRestService,
        public _plannerData: PlannerDataService,
        private _excel: VrpExcelService,
    ) {
        this._plannerData.addListeners(['DeliveryDetail', 'Vehicle']);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.innerHeight = window.innerHeight - 65;
    }

    ngOnInit() {
        this.onResize();

        this._route.queryParams.subscribe((params: any) => {
            if (params.timeFilter) {
                const tf: string[] = params.timeFilter.split('-');
                this.timeFilter = { start: tf[0], end: tf[1] };
                this._filterJobMarkersByTime();
            }
        });
    }

    ngAfterViewInit(): void {
        const vehicleObject = this._plannerData.Vehicle;
        const jobObject = this._plannerData.DeliveryDetail;

        this._subscriptions = [
            vehicleObject.data$.subscribe((res) => { // subcribe to listen to data
                console.log('PlannerVehicleTrackingComponent -> Vehicle:get', res);
                res.forEach((t) => {
                    if (t.DriverUsername) {
                        const v: any = this._getVehicle(t.Id);
                        Object.assign(v, t);
                    }
                });
            }),

            vehicleObject.update$.subscribe((msg) => {
                console.log('PlannerVehicleTrackingComponent -> Vehicle:update', msg);
                // this.renderVehicles();
            }),

            jobObject.data$.subscribe((res) => { // subcribe to listen to data
                console.log('PlannerVehicleTrackingComponent -> DeliveryDetail:get', res);
                setTimeout(() => {
                    this.renderDelivers(res);
                    this.updateUnassignedJobs();
                });
            }),

            jobObject.update$.subscribe((msg) => {
                console.log('PlannerVehicleTrackingComponent -> DeliveryDetail:update', msg);
                const affectedJobIds = msg.data.map((d) => d.Id);
                const affectedLayers = this.vrpLeaflet.select((m) => m.tags && affectedJobIds.includes(m.tags.Id)); // update markers correctly

                if (msg.purpose === 'delete') {
                    this.vrpLeaflet.removeLayers(affectedLayers);
                } else {
                    affectedLayers.forEach((m) => m.updateMarker());
                }
            }),

            this._plannerData.onPlanChanged.subscribe((sol: any) => {
                this.updateUnassignedJobs();
            }),
        ];

        this.openVehicle();

        this._plannerRest.getVehicleLastLocation().subscribe((res) => {
            console.log('PlannerVehicleTrackingComponent -> ngOnInit -> VehicleLocationLog:get', res);
            this._updateVehicleLocations(res);
        });

        this._socket.onJSON('VehicleLocationLog', (msg) => {
            console.log('PlannerVehicleTrackingComponent -> ngOnInit -> VehicleLocationLog:update', msg);
            try {
                const positions = msg.data;
                this._updateVehicleLocations(positions);
            } catch (err) {
                console.error(err);
            }
        });
    }

    ngOnDestroy() {
        this.vrpLeaflet.highlightOff().removeAllLayers();
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._socket.removeListener('VehicleLocationLog');
        this._plannerData.removeAllListeners();
    }

    renderDelivers(jobData: any[]) {
        if (this.vrpLeaflet) {
            this.vrpLeaflet.highlightOff().removeAllLayers();
        } else {
            return;
        }

        this.vehicles.forEach((v) => {
            v.marker = undefined;
            v.checked = false;
            v.route = undefined;
        });

        const assignedVehicleIds: string[] = [];
        const allMarkers = jobData.map((d) => {
            if (d.VehicleId && !assignedVehicleIds.includes(d.VehicleId)) {
                assignedVehicleIds.push(d.VehicleId);
            }
            return new PlannerJobMarker(d);
        });
        this.vrpLeaflet.add(allMarkers);

        // set vehicles
        assignedVehicleIds.sort(); // sort according to id
        assignedVehicleIds.forEach((id) => {
            const v: any = this._getVehicle(id);
            const markers = allMarkers.filter((m) => m.tags.VehicleId === v.Id);
            if (markers.length > 0) {
                this.addJobsToVehicleRoute(v, markers);
                v.route.markers.sort((a, b) => a.compareWith(b)); // sort activities in route based on actual deliver time and EngineRouteSeqNum
                v.route.updateLatLngs();
            }
        });

        this._plannerRest.getVehicleLastLocation().subscribe((res) => this._updateVehicleLocations(res));

        this.openVehicle();
    }

    openVehicle(v: any = undefined) {
        if (v) { // view details of a route
            this.selectedVehicle = v;
            v.checked = true; // location updates will be visible only if vehicle is selected
            const mRoute = v.route;
            if (this.vrpLeaflet && this.vrpLeaflet.isInitialized) {
                mRoute.highlight();
            }

            let prevTags;
            mRoute.markers.forEach((m) => {
                if (!prevTags || prevTags.Address !== m.tags.Address || prevTags.JobType !== m.tags.JobType) {// not same location
                    m._subHeader = `${m.tags.JobType} at ${m.tags.Address}`;
                } else {
                    m._subHeader = undefined;
                }
                prevTags = m.tags;
            });

            // == update nav
            this.navData = mRoute.markers;
            this.navSettings = this.actListSettings;
            this.navSettings.title = v.Id;

        } else { // view all routes
            this.selectedVehicle = undefined;
            // == update nav
            if (this.vehicles) {
                this.vehicles.sort((v1, v2) => v1.Id.localeCompare(v2.Id));
                this.navData = this.vehicles.filter((t) => t.route && t.route.markers && t.route.markers.length > 0) || [];
            }

            this.navSettings = this.vehicleListSettings;
            this.navSettings.title = 'Vehicles';
            if (this.vrpLeaflet && this.vrpLeaflet.isInitialized) {
                this.vrpLeaflet.highlightOff();
            }
        }
        if (this.vehicles) {
            this.vehicles.forEach((t) => this.visualizeVehicle(t));
        }
    }

    updateUnassignedJobs() {
        this.unassignedJobMarkers = this.vrpLeaflet.select((l) => l instanceof PlannerJobMarker && !l.tags.VehicleId);
    }

    openOrderDetailDialog(orderId: string) {
        this._dialog.openOrderDetailById(orderId, false);
    }

    toggleDispatchPanel(visible: boolean) {
        // const planDate: Date = this._plannerData.DeliveryDetail.queryObject.startDate;
        if (visible) {
            // if (!planDate.isPastDay()) {
            this.updateUnassignedJobs();
            this.sideNavRight.open();
            this._plannerData.dispatchPanelToggled$.next(this.sideNavRight.opened);
            // } else {
            // 	this._dialog.error('Not allow to modify assigned job sequence of past days');
            // }
        } else {
            this.sideNavRight.close();
            if (this.selectedVehicle) {
                this.visualizeVehicle(this.selectedVehicle);
            } else {
                this.navData = (this.vehicles && this.vehicles.filter((v) => v.route && v.route.markers && v.route.markers.length > 0)) || [];
            }
            this._plannerData.dispatchPanelToggled$.next(this.sideNavRight.opened);
        }
    }

    protected onJobsAddedToVehicle(event) {
        const v = this._getVehicle(event.vehicle.Id);
        this.addJobsToVehicleRoute(v, event.markers);
    }

    protected addJobsToVehicleRoute(vehicle: any, markers: PlannerJobMarker[]) {
        if (vehicle) {

            markers.forEach((m) => m.tags.VehicleId = vehicle.Id);
            if (!vehicle.route) {
                // console.log('PlannerVehicleTrackingComponent -> protectedaddJobsToVehicleRoute -> vehicle', vehicle);

                const startMarker = new VrpBasicStationMarker(vehicle.Id, vehicle.color, {
                    address: { lat: vehicle.StartAddressLat, lng: vehicle.StartAddressLng, postal: vehicle.StartAddressPostal },
                });

                let stopMarker;

                if (vehicle.ReturnToEndAddress) {
                    stopMarker = new VrpBasicStationMarker(vehicle.Id, vehicle.color, {
                        address: { lat: vehicle.EndAddressLat, lng: vehicle.EndAddressLng, postal: vehicle.EndAddressPostal },
                    });
                }

                vehicle.route = new PlannerPath(vehicle.Id, startMarker, markers, stopMarker, vehicle.color, undefined);
                this.vrpLeaflet.add([startMarker, stopMarker, vehicle.route]);
            } else {
                vehicle.route.insertMarkers(markers);
            }
        }
    }

    protected visualizeVehicle(v: any) {
        const allLayers = [];
        if (v.marker) {
            allLayers.push(v.marker);
        }

        if (v.route) {
            allLayers.push(v.route, ...v.route.markers, v.route.startMarker, v.route.stopMarker);
        }

        this._toggleLayers(allLayers, this.selectedVehicle ? this.selectedVehicle === v : v.checked);

    }

    private _getVehicle(id: string) {
        let v = this.vehicles.find((t) => t.Id === id);
        if (!v) {
            const color = VrpMapUtils.getRandomColor(this.vehicles.length);
            v = { Id: id, checked: false, color };
            this.vehicles.push(v);
        }
        return v;
    }

    private _filterJobMarkersByTime() {
        const showLayers: any[] = [];
        const hideLayers: any[] = [];

        this.vrpLeaflet.select((m) => m instanceof PlannerJobMarker).forEach((m) => {
            VrpUtils.isTimeWindowWithinRange(m.tags, this.timeFilter) ? showLayers.push(m) : hideLayers.push(m);
        });

        this._toggleLayers(showLayers, true);
        this._toggleLayers(hideLayers, false);
    }

    private _exportPlanToExcel(vehicle: any = undefined) {
        const baseFileName: string = `plan-${this._plannerData.DeliveryDetail.queryObject.startDate.YYMMDD()}`;
        if (!vehicle) {
            const fileName: string = `${baseFileName}.xlsx`;
            const data = [];
            this.vehicles.filter((v) => v.route).forEach((v) => {
                data.push(...v.route.markers.map((m) => m.tags));
            });
            this._excel.jsonToSingleSheetExcelFile(data, PLAN_TABLE_CONFIG, 'Plan', fileName);
        } else {
            if (vehicle.route) {
                const data = vehicle.route.markers.map((m) => m.tags);
                const fileName: string = `${baseFileName}-${vehicle.Id}.xlsx`;
                this._excel.jsonToSingleSheetExcelFile(data, PLAN_TABLE_CONFIG, 'Plan', fileName);
            }
        }
    }

    private _toggleLegend(legendIndex: number): any {
        let affectedLayers: any[] = [];
        if (legendIndex === 0) {
            affectedLayers = this.vrpLeaflet.select((m) => m instanceof PlannerVehicleMarker);
        } else if (legendIndex === 7) {
            affectedLayers = this.vrpLeaflet.select((m) => m instanceof VrpBasicStationMarker);
        } else {
            affectedLayers = this.vrpLeaflet.select((m) => m instanceof PlannerJobMarker && m.getStatus() === legendIndex);
        }

        this._toggleLayers(affectedLayers, this.legends[legendIndex].checked);
    }

    private _updateVehicleMarker(v) {
        if (v.LastSeen) {
            if (!v.marker) {
                v.marker = new PlannerVehicleMarker(v, v.color);
                this.vrpLeaflet.add(v.marker);
            } else {
                v.marker.tags = v;
                v.marker.setLatLng([v.LastSeen.Lat, v.LastSeen.Lng]);
                v.marker.updateMarker();
            }

            this.vrpLeaflet.toggleLayers([v.marker], v.checked && this.legends[0].checked);
        }
    }

    private _updateVehicleLocations(positions: any[]) {
        if (positions) {
            positions.forEach((l) => {
                const assignedVehicle = this.vehicles.find((t) => (t.Id === l.VehicleId && t.DriverUsername));
                // only update position if the vehicle is assigned
                if (assignedVehicle) {
                    const v = this._getVehicle(l.VehicleId);
                    if (v) {
                        v.LastSeen = l;
                        this._updateVehicleMarker(v);
                    }
                }
            });
        }
    }

    private _toggleLayers(layers: any[], visible: boolean) {
        if (visible) {
            const selectedVehicleIds: string[] = this.selectedVehicle ? [this.selectedVehicle.Id] : this.vehicles.filter((v) => v.checked).map((v) => v.Id);

            const filteredMarkers: any[] = layers.filter((m) => {
                if (m instanceof PlannerJobMarker) {
                    if (VrpUtils.isTimeWindowWithinRange(m.tags, this.timeFilter)) { // check if within time filter
                        if (this.legends[m.getStatus()].checked) {
                            return m.tags.VehicleId ? selectedVehicleIds.includes(m.tags.VehicleId) : true;
                        }
                    }
                } else if (m instanceof PlannerVehicleMarker) {
                    return this.legends[0].checked && selectedVehicleIds.includes(m.tags.Id);
                } else if (m instanceof VrpBasicStationMarker) {
                    return this.legends[7].checked && selectedVehicleIds.includes(m.routeId);
                } else if (m instanceof PlannerPath) {
                    return selectedVehicleIds.includes(m.id);
                }
                return false;
            });

            this.vrpLeaflet.showLayers(filteredMarkers);
        } else {
            this.vrpLeaflet.hideLayers(layers);
        }
    }
}
