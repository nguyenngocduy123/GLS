import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerMessageBoxComponent } from './planner-message-box.component';

const routes: Routes = [
    { path: '', component: PlannerMessageBoxComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerMessageBoxRoutingModule { }
