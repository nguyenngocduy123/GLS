import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerDataManagementComponent } from './planner-data-management.component';
import { PlannerDataManagementRoutingModule } from './planner-data-management-routing.module';
import { VrpSearchLocationModule } from '@app/vrp-common/pages/search-location/vrp-search-location.module';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerDataManagementRoutingModule,
        VrpSearchLocationModule,
    ],
    declarations: [
        PlannerDataManagementComponent,
    ],
})
export class PlannerDataManagementModule { }
