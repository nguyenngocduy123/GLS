import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MyDateRangePickerModule } from 'mydaterangepicker';

import { PLANNER_ROUTES } from './planner.routes';
import { PlannerDataService } from './services/planner-data.service';
import { PlannerDialogService } from './services/planner-dialog.service';
import { VrpBasicModule } from '@app/vrp-basic';
import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import {
    PlannerOrderDetailDialogComponent,
    PlannerCustomSearchDialogComponent,
    PlannerDateSelectionDialogComponent,
    PlannerItemDetailDialogComponent,
    PlannerVehicleDetailDialogComponent,
    PlannerVehicleTypeDetailDialogComponent,
    PlannerJobListDialogComponent,
} from '@app/planner/dialogs';

@NgModule({
    imports: [
        PlannerSharedModule,
        RouterModule.forChild(PLANNER_ROUTES),
        MyDateRangePickerModule,
        VrpBasicModule,
    ],
    declarations: [
        PlannerCustomSearchDialogComponent,
        PlannerDateSelectionDialogComponent,
        PlannerItemDetailDialogComponent,
        PlannerVehicleDetailDialogComponent,
        PlannerVehicleTypeDetailDialogComponent,
        PlannerJobListDialogComponent,
    ],
    providers: [
        PlannerDialogService,
        PlannerDataService,
    ],
    entryComponents: [
        PlannerOrderDetailDialogComponent,
        PlannerCustomSearchDialogComponent,
        PlannerDateSelectionDialogComponent,
        PlannerItemDetailDialogComponent,
        PlannerVehicleDetailDialogComponent,
        PlannerVehicleTypeDetailDialogComponent,
        PlannerJobListDialogComponent,
    ],
})
export class PlannerModule { }
