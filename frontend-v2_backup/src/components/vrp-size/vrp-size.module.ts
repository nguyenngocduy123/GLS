import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpVehicleCapacityComponent } from './components/vrp-vehicle-capacity/vrp-vehicle-capacity.component';
import { VrpJobDemandComponent } from './components/vrp-job-demand/vrp-job-demand.component';

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpVehicleCapacityComponent,
        VrpJobDemandComponent,
    ],
    exports: [
        VrpVehicleCapacityComponent,
        VrpJobDemandComponent,
    ],
})
export class VrpSizeModule { }
