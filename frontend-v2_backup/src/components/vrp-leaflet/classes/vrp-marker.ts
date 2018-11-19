
import { Marker } from 'leaflet';
import { VrpMapUtils } from './vrp-map-utils';

export class VrpMarker extends Marker {
    id: string;
    tags: any;
    actLabels: string[];

    normalIcon: any = (info: any = undefined) => {
        return VrpMapUtils.createSimpleCircleMarkerIcon();
    }

    setNormalIcon(info: any = undefined): VrpMarker {
        const icon = this.normalIcon instanceof Function ? this.normalIcon(info) : this.normalIcon;
        this.setIcon(icon);
        return this;
    }

    setOnRouteIcon(index: string): VrpMarker {
        this.setIcon(VrpMapUtils.createHtmlMarkerIcon(`<b>${index}</b>`, 'red', 40));
        return this;
    }

    setStartRouteIcon(index: string): VrpMarker {
        this.setIcon(VrpMapUtils.createHtmlMarkerIcon(`<b>${index}</b>`, 'blue', 40));
        return this;
    }

    setEndRouteIcon(index: string): VrpMarker {
        this.setIcon(VrpMapUtils.createHtmlMarkerIcon(`<b>${index}</b>`, 'blue', 40));
        return this;
    }

    showPopup() {
        this.openPopup();
        this.setZIndexOffset(1000);
        return this;
    }

    hidePopup() {
        this.openPopup();
        this.setZIndexOffset(-1000);
    }
}
