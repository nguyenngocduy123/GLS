import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpAddressModule } from '@components/vrp-address';
import { VrpDateTimeModule } from '@components/vrp-datetime';
import { VehicleCapacityModule } from '@components/vrp-vehicle-capacity';
import { VRP_DIALOG_COMPONENTS, VrpDialogService } from './services/vrp-dialog.service';

export { VrpDialogService, VRP_DIALOG_COMPONENTS };

@NgModule({
    imports: [
        SharedModule,

        VrpAddressModule,
        VrpDateTimeModule,
        VehicleCapacityModule,
        VrpAddressModule,
        VrpDateTimeModule,
    ],
    declarations: [
        VRP_DIALOG_COMPONENTS,
    ],
    providers: [
        VrpDialogService,
    ],
    entryComponents: [
        VRP_DIALOG_COMPONENTS,
    ],
})
export class VrpDialogModule { }
