import { DatePipe } from '@angular/common';

import { VrpMapUtils, VrpMarker } from '@components/vrp-leaflet';
import { STATUS_COLORS, STATUS_LABELS } from '@app/planner/planner.config';

const MARKER_COLORS: any[] = STATUS_COLORS.map((c) => c.color);

export class PlannerJobMarker extends VrpMarker {
    private _datePipe = new DatePipe('en-US');

    category: string = 'job';
    type: string = 'marker';

    active: boolean = false;

    constructor(
        d: any,
    ) {
        super([d.lat || d.Lat, d.lng || d.Lng || d.lon || d.Lon], { riseOnHover: true });
        this.tags = d;
        this.updateMarker();
        this.on('click', (s) => this.active = true);
    }

    getStatus(): number {
        return this.tags.VehicleId ? this.tags.Status : 6;
    }

    getStatusLabel(): string {
        return STATUS_LABELS[this.getStatus()];
    }

    compareWith(b: PlannerJobMarker): number {
        const aTime = this.tags.ActualDeliveryTime;
        const bTime = b.tags.ActualDeliveryTime;
        if (aTime && bTime) {
            return new Date(aTime).getTime() - new Date(bTime).getTime();
        } else if (aTime && !bTime) {
            return -1;
        } else if (!aTime && bTime) {
            return 1;
        } else {
            return this.tags.EngineRouteSeqNum - b.tags.EngineRouteSeqNum;
        }
    }

    updateMarker() {
        this.normalIcon = (info = undefined) => VrpMapUtils.createHtmlMarkerIcon(info, MARKER_COLORS[this.getStatus()], info ? 40 : 20);
        this.bindPopup(this._getHtmlPopupContent());
        this.setNormalIcon();
    }

    toString(): string {
        return `${this.tags.JobType} - #${this.tags.DeliveryMasterId}`;
    }

    private _getHtmlPopupContent(): string {
        const tags = this.tags;
        let htmlStr: string = '' + ['Id', 'ContactName', 'Address', 'Postal', 'DeliveryMasterId', 'EngineRouteSeqNum'].filter((t) => tags).map((t) =>
            `<span class='popupMsgLine'><b>${t.replace(/([A-Z])/g, ' $1')}: </b>${tags[t]}</span><br>`,
        ).join('');

        // status
        htmlStr += `<span class='popupMsgLine'><b>Status: </b>${this.getStatusLabel()}</span><br>`;

        // time window
        try {
            const start = this._datePipe.transform(tags.StartTimeWindow, 'shortTime');
            const end = this._datePipe.transform(tags.EndTimeWindow, 'shortTime');
            htmlStr += `<b>${tags.JobType}:</b> (${start}-${end}) - ${tags.VehicleId || 'unassigned'}<br>`;
        } catch (err) {
            console.error(tags);
        }

        if (tags.ActualDeliveryTime) {
            const actualDeliveryTime = this._datePipe.transform(tags.ActualDeliveryTime, 'shortTime');
            htmlStr += `<b>served on:</b>${actualDeliveryTime}<br>`;
        }

        htmlStr += `<b>Coordinates:</b> ${this.getLatLng().lat.toFixed(3)},${this.getLatLng().lng.toFixed(3)}`;

        return htmlStr;
    }
}
