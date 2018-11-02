import { NgModule } from '@angular/core';

import { PlannerSharedModule } from '@app/planner/planner-shared.module';
import { PlannerMonitorComponent } from './planner-monitor.component';
import { PlannerMonitorRoutingModule } from './planner-monitor-routing.module';
import { PlannerMailNotificationComponent } from './mail-notification/planner-mail-notification.component';

@NgModule({
    imports: [
        PlannerSharedModule,
        PlannerMonitorRoutingModule,
    ],
    declarations: [
        PlannerMonitorComponent,
        PlannerMailNotificationComponent,
    ],
})
export class PlannerMonitorModule { }
