import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpDialogModule } from '@components/vrp-dialog';
import { VrpTableComponent } from './components/table/vrp-table.component';
import { VrpTimeFilterMenuComponent } from './components/time-filter-menu/vrp-time-filter-menu.component';
export { VrpTableComponent } from './components/table/vrp-table.component';

@NgModule({
    imports: [
        SharedModule,
        VrpDialogModule,
    ],
    declarations: [
        VrpTableComponent,
        VrpTimeFilterMenuComponent,
    ],
    exports: [
        VrpTableComponent,
        VrpTimeFilterMenuComponent,
    ],
})
export class VrpTableModule { }
