import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpAddress } from './classes/vrp-address';
import { VrpAddressInputComponent } from './components/vrp-address-input/vrp-address-input.component';
import { VrpAddressFormComponent } from './components/vrp-address-form/vrp-address-form.component';

export { VrpAddressInputComponent, VrpAddress };

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpAddressInputComponent,
        VrpAddressFormComponent,
    ],
    exports: [
        VrpAddressInputComponent,
        VrpAddressFormComponent,
    ],
})
export class VrpAddressModule { }
