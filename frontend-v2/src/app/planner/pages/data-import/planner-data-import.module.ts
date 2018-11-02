import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerDataImportComponent } from './planner-data-import.component';
import { PlannerDataImportRoutingModule } from './planner-data-import-routing.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerDataImportRoutingModule,
    ],
    declarations: [
        PlannerDataImportComponent,
    ],
})
export class PlannerDataImportModule { }
