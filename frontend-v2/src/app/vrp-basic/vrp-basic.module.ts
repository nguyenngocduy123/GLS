import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { VrpBasicDataService } from '@app/vrp-basic/services/basic-data.service';

import { VrpOptimizationSettingsDialogComponent } from './dialogs/optimization-settings/optimization-settings-dialog.component';
import { VrpBasicDialogService } from './services/basic-dialog.service';
import { VrpProblemRestService } from './services/problem-rest.service';
import { VRP_BASIC_ROUTES } from './vrp-basic.routes';

import { AppSharedModule } from '@app/app-shared.module';

export { VrpProblemRestService, VrpBasicDataService };

@NgModule({
    imports: [
        AppSharedModule,
        RouterModule.forChild(VRP_BASIC_ROUTES),
    ],
    declarations: [
        VrpOptimizationSettingsDialogComponent,
    ],
    providers: [
        VrpBasicDialogService,
        VrpBasicDataService,
    ],
    entryComponents: [
        VrpOptimizationSettingsDialogComponent,
    ],
    exports: [
        VrpOptimizationSettingsDialogComponent,
    ],
})
export class VrpBasicModule { }
