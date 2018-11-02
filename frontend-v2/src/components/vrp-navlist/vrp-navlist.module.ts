import { NgModule } from '@angular/core';

import { SharedModule } from '@root/shared.module';
import { VrpNavListComponent, IVrpNavListSettings } from './components/vrp-nav-list/vrp-nav-list.component';

export { IVrpNavListSettings };

@NgModule({
    imports: [
        SharedModule,
    ],
    declarations: [
        VrpNavListComponent,
    ],
    exports: [
        VrpNavListComponent,
    ],
})
export class VrpNavlistModule { }
