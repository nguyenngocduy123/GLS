import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerDataImportComponent } from './planner-data-import.component';

const routes: Routes = [
    { path: '', component: PlannerDataImportComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerDataImportRoutingModule { }
