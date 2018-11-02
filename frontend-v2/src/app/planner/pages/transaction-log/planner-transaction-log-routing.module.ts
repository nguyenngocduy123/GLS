import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlannerTransactionLogComponent } from './planner-transaction-log.component';

const routes: Routes = [
    { path: '', component: PlannerTransactionLogComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlannerTransactionLogRoutingModule { }
