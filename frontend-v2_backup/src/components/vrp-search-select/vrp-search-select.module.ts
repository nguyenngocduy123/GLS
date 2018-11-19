import { NgModule } from '@angular/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { SharedModule } from '@root/shared.module';
import { VrpSearchSelectComponent } from './components/search-select/vrp-search-select.component';
import { VrpSearchSelectFormFieldComponent } from './components/search-select-form-field/vrp-search-select-form-field.component';

@NgModule({
    imports: [
        SharedModule,
        NgxMatSelectSearchModule,
    ],
    declarations: [
        VrpSearchSelectComponent,
        VrpSearchSelectFormFieldComponent,
    ],
    exports: [
        VrpSearchSelectComponent,
        VrpSearchSelectFormFieldComponent,
    ],
})
export class VrpSearchSelectModule { }
