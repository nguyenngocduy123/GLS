import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerMessageBoxComponent } from './planner-message-box.component';
import { PlannerMessageBoxRoutingModule } from './planner-message-box-routing.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerMessageBoxRoutingModule,
    ],
    declarations: [
        PlannerMessageBoxComponent,
    ],
})
export class PlannerMessageBoxModule { }
