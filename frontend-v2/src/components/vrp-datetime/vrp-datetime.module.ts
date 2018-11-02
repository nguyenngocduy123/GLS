import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpDatetimeInputComponent } from './components/vrp-datetime-input/vrp-datetime-input.component';
import { VrpTimewindowsInputComponent } from './components/vrp-timewindows-input/vrp-timewindows-input.component';

export { VrpDatetimeInputComponent };

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpDatetimeInputComponent,
        VrpTimewindowsInputComponent,
    ],
    exports: [
        VrpDatetimeInputComponent,
        VrpTimewindowsInputComponent,
    ],
})
export class VrpDateTimeModule { }
