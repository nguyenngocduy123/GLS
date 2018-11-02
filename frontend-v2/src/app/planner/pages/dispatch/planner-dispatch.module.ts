import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerDispatchComponent } from './planner-dispatch.component';

@NgModule({
    imports: [
        PlannerSharedModule,
    ],
    declarations: [
        PlannerDispatchComponent,
    ],
    exports: [
        PlannerDispatchComponent,
    ],
})
export class PlannerDispatchModule { }
