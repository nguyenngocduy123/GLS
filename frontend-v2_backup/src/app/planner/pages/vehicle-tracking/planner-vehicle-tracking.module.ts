import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerVehicleTrackingComponent } from './planner-vehicle-tracking.component';
import { PlannerVehicleTrackingRoutingModule } from './planner-vehicle-tracking-routing.module';
import { PlannerDispatchModule } from '@app/planner/pages/dispatch/planner-dispatch.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerVehicleTrackingRoutingModule,
        PlannerDispatchModule,
    ],
    declarations: [
        PlannerVehicleTrackingComponent,
    ],
})
export class PlannerVehicleTrackingModule { }
