import { DatePipe } from '@angular/common';

import { VrpMapUtils, VrpMarker } from '@components/vrp-leaflet';

export class PlannerVehicleMarker extends VrpMarker {
    private _datePipe = new DatePipe('en-US');
    category: string = 'vehicle';
    color: string;
    type: string = 'marker';

    constructor(
        tags: any,
        color: string,
    ) {
        super([tags.LastSeen.Lat, tags.LastSeen.Lng], { riseOnHover: true });
        this.color = color || VrpMapUtils.getRandomColor();
        this.tags = tags;
        this.bindTooltip(`${this.tags.Id}`, { permanent: true, direction: 'bottom', offset: [0, 0] });
        this.bindPopup('');
        this.updateMarker();
    }

    updateMarker() {
        this.normalIcon = () => VrpMapUtils.createTruckMarkerIcon(this.color);
        this.setTooltipContent(`${this.tags.Id}`);
        this.setPopupContent(this._getHtmlPopupContent());
        this.setNormalIcon();
    }

    private _getHtmlPopupContent() {
        const tags = this.tags;
        let htmlStr: string = '' + ['Id', 'DriverUsername', 'PlateNumber'].filter((t) => tags[t]).map((t) =>
            `<span class='popupMsgLine'><b>${t}: </b>${tags[t]}</span><br>`,
        ).join('');

        try {// last seen status
            if (tags.LastSeen) {
                const recordedTime = this._datePipe.transform(tags.LastSeen.RecordedTime, 'yyyy-MM-dd HH:mm');
                htmlStr += `<span class='popupMsgLine'><b>Last Seen: </b>${recordedTime}</span><br>`;
            }
        } catch (err) {
            console.error(tags);
        }

        // time window
        htmlStr += `<b>Time Window:</b> ${tags.StartTime} - ${tags.EndTime}<br>`;
        htmlStr += `<b>Coordinates:</b> ${this.getLatLng().lat.toFixed(3)},${this.getLatLng().lng.toFixed(3)}`;

        return htmlStr;
    }
}
