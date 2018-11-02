import { Component, Input } from '@angular/core';

export interface IVrpLegend {
    className?: string;
    text?: string;
    checked?: boolean;
    disabled?: boolean;
    toggle?: Function;
}

@Component({
    selector: 'vrp-leaflet-legend',
    templateUrl: './vrp-leaflet-legend.component.html',
    styleUrls: ['../map/vrp-leaflet.component.scss'],
})
export class VrpLeafletLegendComponent {

    @Input() legends: IVrpLegend[];

    constructor() { }
}
