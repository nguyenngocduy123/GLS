import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VrpDashboardComponent } from './dashboard.component';

const routes: Routes = [
    { path: '', component: VrpDashboardComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class VrpDashboardRoutingModule { }
