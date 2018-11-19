import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpAddress } from './classes/vrp-address';
import { VrpAddressInputComponent } from './components/vrp-address-input/vrp-address-input.component';

export { VrpAddressInputComponent, VrpAddress };

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpAddressInputComponent,
    ],
    exports: [
        VrpAddressInputComponent,
    ],
})
export class VrpAddressModule { }
