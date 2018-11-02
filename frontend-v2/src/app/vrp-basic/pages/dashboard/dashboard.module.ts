import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { VrpDashboardComponent } from './dashboard.component';
import { VrpDashboardRoutingModule } from './dashboard-routing.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        VrpDashboardRoutingModule,
    ],
    declarations: [
        VrpDashboardComponent,
    ],
})
export class VrpDashboardModule { }
