import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpVehicleCapacityComponent } from '@components/vrp-vehicle-capacity/components/vrp-vehicle-capacity.component';

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpVehicleCapacityComponent,
    ],
    exports: [
        VrpVehicleCapacityComponent,
    ],
})
export class VehicleCapacityModule { }
