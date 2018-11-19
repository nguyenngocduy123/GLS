import { DatePipe } from '@angular/common';
import { VrpMapUtils, VrpMarker, VrpPath } from '@components/vrp-leaflet';

import { VrpBasicStationMarker } from './vrp-basic-station-marker';

const DATEPIPE = new DatePipe('en-US');

export class VrpBasicPath extends VrpPath {

    checked: boolean;

    startMarker: VrpBasicStationMarker;
    stopMarker: VrpBasicStationMarker;

    constructor(
        id: string,
        startMarker: VrpBasicStationMarker,
        markers: VrpMarker[],
        stopMarker: VrpBasicStationMarker,
        color: string,
        tags: any,
    ) {
        super([], { color: color });

        this.id = id;
        this.color = color || VrpMapUtils.getRandomColor();
        this.markers = markers;
        this.tags = tags;
        this.startMarker = startMarker;
        this.stopMarker = stopMarker;

        this.updateLatLngs();
        // this.setStyle({ weight: 6, opacity: 1, color: 'red' });

        this.on('add', (target) => {
            this.setDefaultStyle().bindPopup(this._getHtmlPopupContent());
        });

        this.on('remove', (target) => {
            if (VrpPath.highlightedPath === this) {
                this.highlight(false);
            }
        });
    }

    updateLatLngs(latlngs: any[] = undefined): VrpPath {
        const _latlngs: any[] = latlngs || [this.startMarker.getLatLng(), ...this.markers.map((t) => t.getLatLng())];
        if (this.stopMarker) {
            _latlngs.push(this.stopMarker.getLatLng());
        }
        this.bindPopup(this._getHtmlPopupContent());
        super.updateLatLngs(_latlngs);
        return this;
    }

    protected _getHtmlPopupContent(): string {
        const tags = this.tags;

        const start = DATEPIPE.transform(tags.start_time, 'shortTime');
        const end = DATEPIPE.transform(tags.end_time, 'shortTime');

        const htmlStr: string = [
            { label: 'Vehicle Id', value: tags.vehicle_id },
            { label: 'Distance', value: tags.distance },
            { label: 'Driver Name', value: tags.driver_name },
            { label: 'Travel Period', value: `${start} -${end}` },
        ].filter((s) => s.value).map((s) => `<span class='popupMsgLine'><b>${s.label}:</b>:${s.value} </span>`).join('<br>');

        return htmlStr;
    }
}
