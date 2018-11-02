import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerVehicleTrackingComponent } from './planner-vehicle-tracking.component';

const routes: Routes = [
    { path: '', component: PlannerVehicleTrackingComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerVehicleTrackingRoutingModule { }
