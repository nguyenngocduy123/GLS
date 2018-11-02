import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { SharedModule } from '@root/shared.module';
import { VrpDialogModule } from '@components/vrp-dialog';
import { VrpLeafletModule } from '@components/vrp-leaflet';
import { VrpTableModule } from '@components/vrp-table';
import { VrpNavlistModule } from '@components/vrp-navlist';
import { VrpSearchSelectModule } from '@components/vrp-search-select';
import { VrpBasicEngineLabelPipe } from '@app/vrp-basic/pipes/basic.pipe';
import { VrpM2kmPipe, VrpTruncatePipe } from '@app/vrp-common/pipes/vrp.pipe';

@NgModule({
    imports: [
        SharedModule,

        VrpLeafletModule,
        VrpNavlistModule,
    ],
    declarations: [
        VrpBasicEngineLabelPipe,
        VrpM2kmPipe,
        VrpTruncatePipe,
    ],
    exports: [
        // any other module that imports this module gets access to directives can bind to component properties
        SharedModule,
        RouterModule,

        VrpDialogModule,
        VrpLeafletModule,
        VrpTableModule,
        VrpNavlistModule,
        VrpSearchSelectModule,

        VrpBasicEngineLabelPipe,
        VrpM2kmPipe,
        VrpTruncatePipe,
    ],
})
export class AppSharedModule { }
