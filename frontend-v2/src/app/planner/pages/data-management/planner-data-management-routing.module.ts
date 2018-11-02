import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerDataManagementComponent } from './planner-data-management.component';

const routes: Routes = [
    { path: '', component: PlannerDataManagementComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerDataManagementRoutingModule { }
