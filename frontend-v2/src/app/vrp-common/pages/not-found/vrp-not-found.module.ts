import { NgModule } from '@angular/core';

import { AppSharedModule } from '@app/app-shared.module';
import { VrpNotFoundRoutingModule } from './vrp-not-found-routing.module';
import { VrpNotFoundComponent } from './vrp-not-found.component';

@NgModule({
    imports: [
        AppSharedModule,
        VrpNotFoundRoutingModule,
    ],
    declarations: [
        VrpNotFoundComponent,
    ],
})
export class VrpNotFoundModule { }
