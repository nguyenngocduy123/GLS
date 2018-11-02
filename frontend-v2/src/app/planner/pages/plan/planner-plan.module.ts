import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerPlanComponent } from './planner-plan.component';
import { PlannerPlanRoutingModule } from './planner-plan-routing.module';
import { VrpSolutionDetailModule } from '@app/vrp-common/pages/solution-detail/vrp-solution-detail.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerPlanRoutingModule,
        VrpSolutionDetailModule,
    ],
    declarations: [
        PlannerPlanComponent,
    ],
})
export class PlannerPlanModule { }
