import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { control, LatLngBounds, Layer, LayerGroup, Map, Marker, TileLayer } from 'leaflet';
import * as L from 'leaflet';
import 'leaflet.gridlayer.googlemutant';
import 'leaflet.markercluster';
import { remove as _remove, filter as _filter } from 'lodash-es';

import { VrpMarker } from '@components/vrp-leaflet/classes/vrp-marker';
import { VrpPath } from '@components/vrp-leaflet/classes/vrp-path';
import { VrpRouteMeasure } from '@components/vrp-leaflet/classes/vrp-route-measure';
import { VrpMapService } from '@components/vrp-leaflet/services/vrp-map.service';
import { BASE_LAYERS } from '@components/vrp-leaflet/vrp-leaflet.config';

@Component({
    selector: 'vrp-leaflet',
    templateUrl: './vrp-leaflet.component.html',
    styleUrls: ['./vrp-leaflet.component.scss'],
    encapsulation: ViewEncapsulation.None,
})
export class VrpLeafletComponent implements AfterViewInit {

    private _map: Map = undefined;
    private _layers: Layer[] = [];
    private _routeMeasure: VrpRouteMeasure;
    private _markerCluster: L.MarkerClusterGroup = L.markerClusterGroup({ maxClusterRadius: 30, disableClusteringAtZoom: 17 });

    @Input() legends: any[];

    @Output() markerClicked: EventEmitter<VrpMarker> = new EventEmitter();
    @Output() pathClick: EventEmitter<string> = new EventEmitter();

    zoom: number = 12;
    center: any = [1.370366, 103.823723];

    tileLayers: any;

    currentHighlightedPath: VrpPath;

    measureMode: boolean = false;
    @Input() curveMode: boolean = false;
    isInitialized: boolean = false;

    @Input() clusteringMode: boolean = true;

    @ViewChild('mapDiv') mapEl: ElementRef;

    constructor(
        private _mapService: VrpMapService,
    ) {
        this.isInitialized = false;
    }

    ngAfterViewInit() {
        this._map = new Map(this.mapEl.nativeElement, { zoomControl: false, attributionControl: false, maxZoom: 18 }).setView(this.center, this.zoom);
        this._addTileLayersAndControls(); // add tile layers and controls
        this._setupEventHandlers();

        setTimeout(() => this.invalidateSize());
        this.isInitialized = true;
    }

    invalidateSize() {
        this._map.invalidateSize();
        return this;
    }

    getMapInstance() {
        return this._map;
    }

    add(layer: any | any[]) {
        if (layer instanceof Array) {
            this._layers.push(...layer);
        } else if (layer) {
            this._layers.push(layer);
        } else {
            console.error(`Undefined layer`);
        }
        return this;
    }

    find(selector: any) {
        return selector ? this._layers.find(selector) : undefined;
    }

    get(id: string) {
        return this._layers.find((l: any) => l.id === id);
    }

    remove(selector: any = {}): VrpLeafletComponent {
        if (this._layers) {
            const allLayers = this._layers;
            if (allLayers.length > 0) {
                const filteredLayers = _remove(allLayers, selector);
                this._removeFromMap(filteredLayers);
            }

        }
        return this;
    }

    removeLayers(layersToBeRemoved: any[]): VrpLeafletComponent {
        if (this._layers && layersToBeRemoved && layersToBeRemoved.length > 0) {
            const allLayers = this._layers;
            if (allLayers.length > 0) {
                layersToBeRemoved.forEach((l) => {
                    const i = allLayers.indexOf(l);
                    if (i > -1) {
                        allLayers.splice(i, 1);
                    }
                });
                this._removeFromMap(layersToBeRemoved);
            }

        }
        return this;
    }

    removeAllLayers() {
        try {
            this._removeFromMap(this._layers);
        } catch (err) {
            console.error(err);
        }
        this._layers = [];
    }

    select(selector: any = {}) {
        // console.debug('selector', selector);
        return _filter(this._layers, selector);
    }

    hide(selector: any = {}) {
        return this.hideLayers(this.select(selector));
    }

    hideLayers(layers: Layer[]): VrpLeafletComponent {
        // console.log('hideLayers', layers);
        if (layers && layers.length > 0) {
            if (this.clusteringMode) {
                this._markerCluster.removeLayers(layers.filter((l) => l instanceof Marker));
                this._removeFromMap(layers.filter((l) => !(l instanceof Marker)));
            } else {
                this._removeFromMap(layers);
            }

            // if (this.isMarkerClustering) {
            //     this._markerCluster.clearLayers();
            // }
            // this._removeFromMap(layers);
        }
        return this;
    }

    toggleLayers(layers: Layer[], visible: boolean): VrpLeafletComponent {
        return (visible) ? this.showLayers(layers) : this.hideLayers(layers);
    }

    show(selector: any = {}, hideOthers: boolean = false): VrpLeafletComponent {
        return this.showLayers(this.select(selector), hideOthers);
    }

    showLayers(layers: Layer[], hideOthers: boolean = false): VrpLeafletComponent {
        // console.log('showLayers', layers);
        if (!this._map) {
            console.error('show - No map initialized yet');
            return this;
        }
        if (hideOthers) {
            this._layers.forEach((l) => {
                if (layers.indexOf(l) === -1) {
                    this._map.removeLayer(l);
                }
            });
        }

        if (layers && layers.length > 0) {
            if (this.clusteringMode) {
                const paths = layers.filter((l) => !(l instanceof Marker));
                this._addToMap(paths);
                this._markerCluster.addLayers(layers.filter((l) => l instanceof Marker));
            } else {
                this._addToMap(layers);
            }
        }
        return this;
    }

    fitBounds(selector: any = {}) {
        const latLngs = [];
        if (selector instanceof LatLngBounds) {
            this._map.fitBounds(selector);
            return this;
        }
        this.select(selector).forEach((l) => {
            if (l instanceof VrpMarker) {
                latLngs.push(l.getLatLng());
            }

            if (l instanceof VrpPath) {
                latLngs.push(l.getBounds());
            }
        });
        const bounds: L.LatLngBounds = new LatLngBounds(latLngs);
        if (bounds.isValid()) {
            this._map.fitBounds(bounds);
        }
        return this;
    }

    hightlightOn(path) {
        path.highlight(true);
        if (this.clusteringMode) {
            // this._markerCluster.clearLayers();
            this._addToMap(path.markers);
        }
    }

    highlightOff() {
        if (VrpPath.highlightedPath) {
            if (this.clusteringMode) {
                this._removeFromMap(VrpPath.highlightedPath.markers);
            }
            VrpPath.highlightedPath.highlight(false);
        }
        return this;
    }

    toggleMarkerClustering() {
        this.clusteringMode = !this.clusteringMode;
        if (!this.clusteringMode) { // if clusteringMode is off
            const selected = this._layers.filter((l) => (l instanceof VrpMarker && this._markerCluster.hasLayer(l)));
            this._markerCluster.clearLayers(); // remove from marker clusters
            this._addToMap(selected); // add to map
        } else {
            const selected = this._layers.filter((l) => (l instanceof VrpMarker && this._map.hasLayer(l)));
            this._removeFromMap(selected); // remove from map
            this._markerCluster.addLayers(selected); // add to clusters
        }
    }

    toggleMeasureMode() {
        this.measureMode = !this.measureMode;
        console.log('toggleMeasureMode', this.measureMode);

        if (!this._routeMeasure) {
            this._routeMeasure = new VrpRouteMeasure(this._mapService, this._map);

            this._map.on('click', (event: any) => {
                if (this.measureMode) {// if in measure mode
                    this._routeMeasure.addWaypoint(event.latlng); // add points to measure path
                } else {// if not in measure mode,
                    this._routeMeasure.hide(); // remove measure path
                    this._map.getContainer().style.cursor = ''; // change cursor to normal
                }
            });

            this._map.on('contextmenu', (event) => { // right click event
                if (this.measureMode) {
                    this._routeMeasure.show();
                    this.measureMode = false;
                } else {
                    this._routeMeasure.hide();
                }
                this._map.getContainer().style.cursor = '';
            });
        }

        if (this.measureMode) {
            this._map.getContainer().style.cursor = 'crosshair'; // change cursor to crosshair
            this._routeMeasure.hide();
        } else {
            this._map.getContainer().style.cursor = ''; // change cursor to normal
            this._routeMeasure.hide();
        }
    }

    toggleCurveMode() {
        this.curveMode = !this.curveMode;

        this.select({ type: 'path' }).forEach((path: VrpPath) => {
            if (this.curveMode) {
                if (!path.curvePath) {
                    const straightPath = path.getLatLngs();
                    this._mapService.getOSMRoute(straightPath).subscribe((res) => {
                        path.curvePath = res.path;
                        path.updateLatLngs(path.curvePath);
                    }, (err) => {
                        console.warn('Failed to connect to map server', err);
                    });
                } else {
                    path.updateLatLngs(path.curvePath);
                }
            } else {
                path.updateLatLngs();
            }
        });

        return this;
    }

    private _addToMap(layers: any[]) {
        (new LayerGroup(layers)).addTo(this._map);
    }

    private _removeFromMap(layers: any[]) {
        try {
            if (this.clusteringMode) {
                this._markerCluster.removeLayers(layers);
            }
            layers.forEach((l) => this._map.removeLayer(l));
        } catch (err) {
            console.error(err);
        }
    }

    private _addTileLayersAndControls() {
        // add tile layer controls
        this.tileLayers = {};
        BASE_LAYERS.forEach((l) => {
            if (l.type === 'xyz') {
                this.tileLayers[l.name] = new TileLayer(l.url, {});
            } else if (l.type === 'google') {
                // this.tileLayers[l.name] = L.gridLayer.googleMutant({ type: l.layerType, styles: l.styles });
            } else if (l.type === 'bing') {
                // this.tileLayers[l.name] = new L.BingLayer(l.key, { type: l.layerType });
            }
            if (l.isDefault) {
                this.tileLayers[l.name].addTo(this._map);
            }
        });

        control.layers(this.tileLayers, {}).addTo(this._map); // add tiles layer control
        // control.scale({ position: 'bottomright' }).addTo(this._map); // add scale control
        control.zoom({ position: 'topright' }).addTo(this._map); // add zoom control

        // searchControl.addTo(this._map);   // add search controls

        this._markerCluster.clearLayers();
        this._markerCluster.addTo(this._map); // add marker cluster

        //  this._map.addControl(searchControl);
    }

    private _setupEventHandlers() {
        this._map.doubleClickZoom.disable(); // disable map zoom when double click

        // this._map.on('geosearch/showlocation', (event) => {
        //     console.log('geosearch/showlocation', event);
        // });

        // this._map.on('dblclick', (event: any) => {
        //     console.log('dblClick', event);
        //     let coord = event.latlng;
        //     this.geoSearchAddress = { lat: coord.lat, lng: coord.lng, postal: '' };
        //     this.geoLocation.x = event.containerPoint.x;
        //     this.geoLocation.y = event.containerPoint.y;
        //     // provider.search({ query: `${coord.lat},${coord.lng}` }).then((res) => {
        //     //     console.log('dblClick', res[0], event);
        //     //     let address = (res && res[0] && res[0].label) ? res[0].label : 'Unknown';
        //     //     this._map.flyTo(coord);
        //     //     this.geoSearchAddress = { lat: coord.lat, lng: coord.lng, address: address, postal: '' };
        //     //     let content = `<b>Address</b>: ${address} <br><b>Coordinates</b>: ${coord.lat.toFixed(4)},${coord.lng.toFixed(4)}`;
        //     //     L.popup().setLatLng(coord).setContent(content).openOn(this._map);
        //     // });
        // });
    }
}
