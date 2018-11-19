
import * as format from 'date-fns/format';

import { VrpMapUtils, VrpMarker } from '@components/vrp-leaflet';

export class VrpBasicJobMarker extends VrpMarker {

    timeWindow: any = { start: undefined, end: undefined };
    jobType: string;
    jobProb: string;
    routeId: string;
    tooltip: string;
    solutionId: string;

    arrivalTime: any = { start: undefined, end: undefined };

    constructor(
        d: any,
        jobType: string = undefined,
    ) {
        super([0, 0], { riseOnHover: true });
        this.jobProb = jobType ? 'shipment' : 'service';
        this.jobType = jobType ? jobType : d.type;

        this.tags = d;
        this.id = `${this.tags.id}_${this.jobType}`;

        this._setTooltip();

        try {
            const address = this.getAddress();
            if (address) {
                this.setLatLng([address.lat, address.lon || address.lng]);
            }
        } catch (err) {
            console.error('VrpBasicJobMarker - invalid address', d);
        }

        this.on('add', (s) => {
            try {
                this.updateMarker();
            } catch (err) {
                console.error('VrpBasicJobMarker', err);
            }
        });
    }

    toString(): string {
        return `${this.jobType.toUpperCase()} - #${this.tags.id} -  ${this._getTimeWindowStr(this.arrivalTime)}`;
    }

    updateMarker() {
        this.normalIcon = (iconHtml: string = undefined) => {
            if (iconHtml) {
                return VrpMapUtils.createHtmlMarkerIcon(iconHtml, 'red', 40);
            } else {
                return VrpMapUtils.createHtmlMarkerIcon(iconHtml, this.routeId ? 'blue' : 'grey', 20);
            }
        };

        this.bindPopup(this._getHtmlPopupContent());
        this.setNormalIcon();
    }

    getTimeWindow() {
        return this.tags.time_windows || (this.jobType === 'pickup' ? this.tags.pickup_time_windows : this.tags.delivery_time_windows);
    }

    getAddress(): any {
        return this.tags.address || (this.jobType === 'pickup' ? this.tags.pickup_address : this.tags.delivery_address);
    }

    getTextAddress(): string {
        const address = this.getAddress();
        return `${address.full_address || address.address}`;
    }

    isUnassignedJob(): boolean {
        return this.routeId ? false : true;
    }

    isSelectedSolutionJob(solutionId: string): boolean {
        return solutionId === this.solutionId;
    }

    isLatLngValid(): boolean {
        return !!this.getLatLng();
    }

    private _setTooltip() {
        // this.tooltip = `Address: ${this.getTextAddress()}`;
        this.tooltip = `Order Id: ${this.tags.id}`;
    }

    private _getTimeWindowStr(tw: any, dateFormat: string = 'HH:mm'): string {
        if (tw) {
            if (Array.isArray(tw)) {
                return tw.map((t) => `[${format(t.start, dateFormat)},${format(t.end, dateFormat)}]`).join(';');

            } else {
                return `[${format(tw.start, dateFormat)},${format(tw.end, dateFormat)}]`;
            }
        }
        return '';
    }

    private _getHtmlPopupContent(): string {
        const tags = this.tags;

        const tw = this.getTimeWindow();

        const address = this.getAddress();

        let htmlStr: string = [
            { label: 'Order Id', value: tags.id },
            { label: 'Order Name', value: tags.name || 'N.A.' },
            { label: 'Job Type', value: `${this.jobType.toUpperCase()} (${this.jobProb.toUpperCase()})` },
            { label: 'Address', value: this.getTextAddress() },
            { label: 'Postal', value: address.postal },
            { label: 'Time Window', value: `${this._getTimeWindowStr(tw)}` },
            { label: 'Assigned To', value: `${this.routeId || 'N.A.'}` },
        ].map((s) => `<span class='popupMsgLine'><b>${s.label}:</b> ${s.value} </span>`).join('<br>');

        htmlStr += `<br><b>Coordinates:</b> ${this.getLatLng().lat.toFixed(3)},${this.getLatLng().lng.toFixed(3)}`;
        return htmlStr;
    }
}
