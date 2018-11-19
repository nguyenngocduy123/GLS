import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { SharedModule } from '@root/shared.module';
import { VrpAddressModule } from '@components/vrp-address';
import { VrpMapService } from './services/vrp-map.service';
import { VrpPath } from './classes/vrp-path';
import { VrpMarker } from './classes/vrp-marker';
import { VrpMapUtils } from './classes/vrp-map-utils';
import { VrpLeafletComponent } from './components/map/vrp-leaflet.component';
import { IVrpLegend, VrpLeafletLegendComponent } from './components/legend/vrp-leaflet-legend.component';

export { VrpMapService, VrpMapUtils, VrpLeafletComponent, VrpPath, VrpMarker, IVrpLegend };

@NgModule({
    imports: [
        SharedModule,

        HttpClientModule,
        VrpAddressModule,
    ],
    declarations: [
        VrpLeafletComponent,
        VrpLeafletLegendComponent,
    ],
    providers: [
        VrpMapService,
    ],
    exports: [
        VrpLeafletComponent,
        VrpLeafletLegendComponent,
    ],
})
export class VrpLeafletModule { VrpMapService; }
