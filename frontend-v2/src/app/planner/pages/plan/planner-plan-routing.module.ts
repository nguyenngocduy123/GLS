import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerPlanComponent } from './planner-plan.component';

const routes: Routes = [
    { path: '', component: PlannerPlanComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerPlanRoutingModule { }
