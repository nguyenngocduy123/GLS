import { NgModule } from '@angular/core';

import { AppSharedModule } from '@app/app-shared.module';
import { VrpSolutionDetailComponent } from './vrp-solution-detail.component';

@NgModule({
    imports: [
        AppSharedModule,
    ],
    declarations: [
        VrpSolutionDetailComponent,
    ],
    exports: [
        VrpSolutionDetailComponent,
    ],
})
export class VrpSolutionDetailModule { }
