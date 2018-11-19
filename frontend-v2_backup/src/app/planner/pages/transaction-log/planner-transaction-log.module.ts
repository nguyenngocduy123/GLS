import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerTransactionLogComponent } from './planner-transaction-log.component';
import { PlannerTransactionLogRoutingModule } from './planner-transaction-log-routing.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerTransactionLogRoutingModule,
    ],
    declarations: [
        PlannerTransactionLogComponent,
    ],
})
export class PlannerTransactionLogModule { }
