import { Polyline } from 'leaflet';
import { antPath } from 'leaflet-ant-path';

import { HIGHLIGHT_PATH_OPTIONS } from '@components/vrp-leaflet/vrp-leaflet.config';

export class VrpPath extends Polyline {

    static highlightedPath: VrpPath;
    static _migrationLayer: any;

    readonly type: string = 'path';

    id: string;
    markers: any[];
    curvePath: any[];
    isHighlighted: boolean = false;

    _map: any;
    _backupMap: any;

    color: string;

    isChanged: boolean = false;

    tags: any;

    updateLatLngs(latlngs: any[] = undefined): VrpPath {
        const _latlngs: any[] = latlngs || this.markers.map((t) => t.getLatLng());

        this.setLatLngs(_latlngs);
        if (this.isHighlighted) {
            this.drawAntPath(true);
        }

        return this;
    }

    setHighlightStyle(): VrpPath {
        this.setStyle({ weight: 2, opacity: 0 });
        return this;
    }

    setDefaultStyle(): VrpPath {
        this.setStyle({ weight: 1, opacity: 1, color: this.color });
        return this;
    }

    highlight(highlighted: boolean = true): VrpPath {
        return (highlighted) ? this._highlightOn() : this._highlightOff();
    }

    fitBounds(): VrpPath {
        if (this._map) {
            const map: any = (this._map);
            map.fitBounds(this.getLatLngs());
        }
        return this;
    }

    drawAntPath(show: boolean = true) {
        if (!this._map) {
            console.warn('Map instance has not been initialized');
            return this;
        }

        if (VrpPath._migrationLayer) {
            this._map.removeLayer(VrpPath._migrationLayer);
        }

        if (show) {
            VrpPath._migrationLayer = antPath(this.getLatLngs(), Object.assign({ 'color': this.color }, HIGHLIGHT_PATH_OPTIONS));
            VrpPath._migrationLayer.addTo(this._map);
        }

        return this;
    }

    show() {
        const map = this._backupMap || this._map;
        if (map) {
            map.addLayer(this);
        }
        return this;
    }

    hide() {
        if (this._map) {
            this._backupMap = this._map;
            this._map.removeLayer(this);
        }
        return this;
    }

    swapMarkers(from: number, to: number) {
        console.log('VrpPath -> swapMarkers -> from, to', from, to);
        try {
            const tmp = this.markers[from];
            this.markers[from] = this.markers[to];
            this.markers[to] = tmp;

            this.isChanged = true;
            this.updateLatLngs();
        } catch (err) {
            console.error(err);
        }
    }

    removeMarker(marker: any): boolean {
        console.log('VrpPath -> marker', marker);
        const index = this.markers.indexOf(marker);
        if (index > -1) {
            marker.updateMarker();
            this.markers.splice(index, 1); // remove from the current route

            this.isChanged = true; // mark route changed
            this.updateLatLngs();

            if (VrpPath.highlightedPath === this) {
                this._highlightOn();
            }
            return true;
        } else {
            return false;
        }
    }

    insertMarkers(markers: any[]) {
        if (markers && markers.length > 0) {
            markers.forEach((m) => {
                m.updateMarker();
                this.markers.push(m);
            });

            this.isChanged = true; // mark route changed
            this.updateLatLngs();

            if (VrpPath.highlightedPath === this) {
                this._highlightOn();
            }
        }
    }

    private _highlightOn(): VrpPath {
        if (VrpPath.highlightedPath) {
            VrpPath.highlightedPath._highlightOff();
        }
        this.isHighlighted = true;

        VrpPath.highlightedPath = this;

        setTimeout(() => {
            this.markers.forEach((m, k) => m.setNormalIcon(`${k + 1}`));
            // console.log('_highlightOn', this.markers);
            this.drawAntPath(true);
        });

        this.fitBounds();

        return this;
    }

    private _highlightOff(): VrpPath {
        this.isHighlighted = false;
        this.markers.forEach((m, k) => m.setNormalIcon());
        this.setDefaultStyle();
        this.drawAntPath(false);
        return this;
    }
}
