import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerMonitorComponent } from './planner-monitor.component';

const routes: Routes = [
    {
        path: '',
        component: PlannerMonitorComponent,
        children: [
            { path: '', redirectTo: 'progress' },
            { path: 'progress', loadChildren: '@app/planner/pages/vehicle-progress/planner-vehicle-progress.module#PlannerVehicleProgressModule' },
            { path: 'tracking', loadChildren: '@app/planner/pages/vehicle-tracking/planner-vehicle-tracking.module#PlannerVehicleTrackingModule' },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerMonitorRoutingModule { }
