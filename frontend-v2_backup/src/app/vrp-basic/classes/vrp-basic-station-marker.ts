import { VrpMapUtils, VrpMarker } from '@components/vrp-leaflet';

export class VrpBasicStationMarker extends VrpMarker {
    readonly category: string = 'station';
    readonly type: string = 'marker';
    routeId: string;
    color: string;

    constructor(
        routeId: string,
        color: string,
        tags: any,
    ) {
        super([0, 0], { riseOnHover: true });
        this.routeId = routeId;
        this.tags = tags;
        this.updateLatLng();
        this.on('add', (s) => this.updateMarker());
    }

    updateLatLng(latlng: any = undefined): VrpBasicStationMarker {
        try {
            this.setLatLng(latlng || [this.tags.address.lat, this.tags.address.lon || this.tags.address.lng]);
        } catch (err) {
            console.error('VrpBasicStationMarker - invalid address', this.tags);
        }
        return this;
    }

    updateMarker() {
        this.bindPopup(this._getHtmlPopupContent());
        this.normalIcon = (iconHtml: string = undefined) => {
            return VrpMapUtils.createStationMarkerIcon(this.color); // .createHtmlMarkerIcon(iconHtml, 'truck-red');
        };
        this.setNormalIcon();
    }

    private _getHtmlPopupContent() {
        const tags = this.tags;

        let htmlStr: string = [
            { label: 'Address', value: tags.address.full_address },
            { label: 'Postal', value: tags.address.postal },

        ].filter((s) => s.value).map((s) => `<span class='popupMsgLine'><b>${s.label}:</b>:${s.value} </span>`).join('<br>');

        htmlStr += `<br><b>Coordinates:</b> ${this.getLatLng().lat.toFixed(3)},${this.getLatLng().lng.toFixed(3)}`;

        return htmlStr;
    }
}
