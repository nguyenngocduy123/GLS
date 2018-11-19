import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerVehicleProgressComponent } from './planner-vehicle-progress.component';
import { PlannerVehicleProgressRoutingModule } from './planner-vehicle-progress-routing.module';
import { PlannerDispatchModule } from '@app/planner/pages/dispatch/planner-dispatch.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerVehicleProgressRoutingModule,
        PlannerDispatchModule,
    ],
    declarations: [
        PlannerVehicleProgressComponent,
    ],
})
export class PlannerVehicleProgressModule { }
