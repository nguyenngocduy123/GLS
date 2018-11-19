import { NgModule } from '@angular/core';
import { AppSharedModule } from '@app/app-shared.module';

import { PlannerDateRangeSelectionComponent } from '@app/planner/components/date-range-selection/planner-date-range-selection.component';
import { PlannerNotificationBoxComponent } from '@app/planner/components/notification-box/planner-notification-box.component';
import { PlannerDateNavigatorComponent } from '@app/planner/components/date-navigator/planner-date-navigator.component';
import { PlannerStatusLabelPipe } from '@app/planner/pipes/planner.pipe';

/**
 * fileoverview  This file should be called by planner pages only
 */

@NgModule({
    imports: [
        AppSharedModule,
    ],
    declarations: [
        PlannerDateRangeSelectionComponent,
        PlannerNotificationBoxComponent,
        PlannerDateNavigatorComponent,

        PlannerStatusLabelPipe,
    ],
    exports: [
        AppSharedModule,
        PlannerDateRangeSelectionComponent,
        PlannerNotificationBoxComponent,
        PlannerDateNavigatorComponent,
    ],
})
export class PlannerSharedModule { }
