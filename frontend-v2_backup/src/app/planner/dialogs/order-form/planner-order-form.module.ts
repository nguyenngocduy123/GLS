import { NgModule } from '@angular/core';

import { AppSharedModule } from '@app/app-shared.module';
import { VrpSearchSelectModule } from '@components/vrp-search-select/vrp-search-select.module';
import { PlannerDeliveryDetailComponent } from './components/delivery-detail/planner-delivery-detail.component';
import { PlannerDeliveryMasterComponent } from './components/delivery-master/planner-delivery-master.component';
import { PlannerDriverNotesComponent } from './components/driver-notes/planner-driver-notes.component';
import { PlannerItemsComponent } from './components/items/planner-items.component';
import { PlannerPlannerNotesComponent } from './components/planner-notes/planner-planner-notes.component';
import { PlannerOrderDetailDialogComponent } from './components/planner-order-detail-dialog.component';
import { PlannerPodComponent } from './components/pod/planner-pod.component';
import { PlannerOrderSummaryComponent } from './components/summary/planner-order-summary.component';
import { PlannerVehicleRestrictionComponent } from './components/vehicle-restriction/planner-vehicle-restriction.component';
export { PlannerOrderDetailDialogComponent } from './components/planner-order-detail-dialog.component';

@NgModule({
    imports: [
        AppSharedModule,
        VrpSearchSelectModule,
    ],
    declarations: [
        PlannerPodComponent,
        PlannerItemsComponent,
        PlannerDeliveryDetailComponent,
        PlannerOrderSummaryComponent,
        PlannerVehicleRestrictionComponent,
        PlannerPlannerNotesComponent,
        PlannerOrderDetailDialogComponent,
        PlannerDriverNotesComponent,
        PlannerDeliveryMasterComponent,
    ],
    exports: [
        PlannerOrderDetailDialogComponent,
    ],
})
export class PlannerOrderFormModule { }
