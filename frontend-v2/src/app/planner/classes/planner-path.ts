import { VrpBasicPath } from '@app/vrp-basic/classes/vrp-basic-path';

import { WS_ROUTE_HEADERS } from '@app/planner/planner.config';

export class PlannerPath extends VrpBasicPath {

    removeMarker(marker: any): boolean {
        const isRemoved = super.removeMarker(marker);
        if (isRemoved) {
            marker.tags.VehicleId = undefined;
            marker.updateMarker();

        }
        return isRemoved;
    }

    insertMarkers(markers: any[]) {
        super.insertMarkers(markers);
        markers.forEach((m) => {
            m.tags.VehicleId = this.id;
            m.updateMarker();
        });

    }

    toCSVData(includeHeader: boolean = true) {
        const csvData = [];

        if (includeHeader) {
            csvData.push(WS_ROUTE_HEADERS);
        }

        this.markers.forEach((m, i) => {
            const tags = m.tags;
            const startTW = (new Date(tags.StartTimeWindow)).toLocaleTimeString();
            const endTW = (new Date(tags.EndTimeWindow)).toLocaleTimeString();
            const actualTime = tags.ActualDeliveryTime ? (new Date(tags.ActualDeliveryTime)).toLocaleTimeString() : '';

            csvData.push([this.id, i, tags.DeliveryMasterId, tags.JobType, tags.Address, tags.ContactName, startTW, endTW, actualTime,
            m.getStatusLabel()]);
        });
        return csvData;
    }

    toMongoJSON() {
        const act = this.markers.filter((a) => a.getStatus() === 1 || a.getStatus() === 5).map((a) => { return { job_id: a.tags.DeliveryMasterId, type: a.tags.JobType.toLowerCase() }; });
        return { vehicle_id: this.id, act: act };
    }

    protected _getHtmlPopupContent(): string {
        const htmlStr: string = `<b>Vehicle Id:</b> ${this.id}`;
        return htmlStr;
    }

    // updateLatLngs(latlngs: any[] = undefined): PlannerPath {
    //     const _latlngs: any[] = latlngs || [this.startMarker.getLatLng(), ...this.markers.map((t) => t.getLatLng())];
    //     if (this.stopMarker) {
    //         _latlngs.push(this.stopMarker.getLatLng());
    //     }
    //     this.bindPopup(this._getHtmlPopupContent());
    //     super.updateLatLngs(_latlngs);
    //     return this;
    // }
}
