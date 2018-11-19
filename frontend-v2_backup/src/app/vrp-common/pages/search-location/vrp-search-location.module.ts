import { NgModule } from '@angular/core';

import { AppSharedModule } from '@app/app-shared.module';
import { VrpAddressModule } from '@components/vrp-address';
import { VrpSearchLocationComponent } from './vrp-search-location.component';

@NgModule({
    imports: [
        AppSharedModule,

        VrpAddressModule,
    ],
    declarations: [
        VrpSearchLocationComponent,
    ],
    exports: [
        VrpSearchLocationComponent,
    ],
})
export class VrpSearchLocationModule { }
