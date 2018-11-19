import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { VrpProblemDetailResolve, VrpProblemDetailComponent } from './vrp-problem-detail.component';
import { VrpProblemDetailRoutingModule } from './vrp-problem-detail-routing.module';
import { VrpSolutionDetailModule } from '@app/vrp-common/pages/solution-detail/vrp-solution-detail.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        VrpProblemDetailRoutingModule,
        VrpSolutionDetailModule,
    ],
    providers: [
        VrpProblemDetailResolve,
    ],
    declarations: [
        VrpProblemDetailComponent,
    ],
})
export class VrpProblemDetailModule { }
