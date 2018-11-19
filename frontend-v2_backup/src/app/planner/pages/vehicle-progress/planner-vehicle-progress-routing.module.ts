import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerVehicleProgressComponent } from './planner-vehicle-progress.component';

const routes: Routes = [
    { path: '', component: PlannerVehicleProgressComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerVehicleProgressRoutingModule { }
