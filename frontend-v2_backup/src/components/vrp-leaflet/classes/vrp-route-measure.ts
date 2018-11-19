import { LayerGroup, Map, LatLng } from 'leaflet';

import { VrpMarker } from './vrp-marker';
import { VrpPath } from './vrp-path';
import { VrpMapUtils } from './vrp-map-utils';
import { VrpMapService } from '@components/vrp-leaflet/services/vrp-map.service';

export class VrpRouteMeasure {

    private _measurePath: VrpPath;
    private _measureGroup: LayerGroup = new LayerGroup();
    private _waypointCount: number = 0;

    private readonly pathStyle: any = {
        color: 'blue', weight: 3, lineCap: 'square', lineJoin: 'round',
    };

    constructor(
        private _mapService: VrpMapService,
        _map: Map,
    ) {
        this._measureGroup.addTo(_map);
    }

    addWaypoint(latLng: LatLng) {
        this._waypointCount++;
        this._measureGroup.addLayer(new VrpMarker(latLng, {
            icon: VrpMapUtils.createSimpleCircleMarkerIcon(`${this._waypointCount}`, 'red', 20),
        })); // add waypoint to map
        if (!this._measurePath) { // add measure path to map
            this._measurePath = new VrpPath([latLng], this.pathStyle);
            this._measureGroup.addLayer(this._measurePath);
        } else {
            this._measurePath.addLatLng(latLng);
        }
    }

    show() {
        this._renderMeasurePath();
    }

    hide() {
        this._measureGroup.clearLayers();
        this._measurePath = undefined;
        this._waypointCount = 0;
    }

    private _renderMeasurePath() {
        if (!this._measurePath || this._measurePath.getLatLngs().length < 2) {
            return;
        }

        this._mapService.getOSMRoute(this._measurePath.getLatLngs()).subscribe((res) => {
            if (res) {
                const distance = res.distance;
                const duration = res.duration;
                let htmlStr = `<b>Distance: </b>${(distance / 1000).toFixed(2)} km <br><b>Duration: </b>${(duration / 60).toFixed(2)} min`;
                if (duration > 0 && distance) {
                    htmlStr += `<br><b>Avg. Speed: </b>${(distance / duration * 3.6).toFixed(0)} km/h`;
                }

                this._measurePath.setLatLngs(res.path);
                this._measurePath.bindPopup(htmlStr).openPopup();
            }
        }, (err) => alert(err));
    }
}
