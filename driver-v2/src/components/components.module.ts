/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from 'ionic-angular';

import { PipesModule } from '../pipes/pipes.module';
import { VrpBtnClearComponent } from './vrp-btn-clear/vrp-btn-clear';
import { VrpHeaderComponent } from './vrp-header/vrp-header';
import { VrpJobDetailsComponent } from './vrp-job-details/vrp-job-details';
import { VrpJobSummaryComponent } from './vrp-job-summary/vrp-job-summary';
import { VrpJobnoteLabelComponent } from './vrp-jobnote-label/vrp-jobnote-label';
import { VrpJobtypeLabelComponent } from './vrp-jobtype-label/vrp-jobtype-label';
import { VrpPhotosComponent } from './vrp-photos/vrp-photos';
import { VrpProgressBarComponent } from './vrp-progress-bar/vrp-progress-bar';

@NgModule({
    declarations: [
        VrpBtnClearComponent,
        VrpHeaderComponent,
        VrpJobDetailsComponent,
        VrpJobSummaryComponent,
        VrpJobnoteLabelComponent,
        VrpJobtypeLabelComponent,
        VrpPhotosComponent,
        VrpProgressBarComponent,
    ],
    imports: [
        IonicModule,
        PipesModule,
        TranslateModule.forChild(),
    ],
    exports: [
        TranslateModule,
        VrpBtnClearComponent,
        VrpHeaderComponent,
        VrpJobDetailsComponent,
        VrpJobSummaryComponent,
        VrpJobnoteLabelComponent,
        VrpJobtypeLabelComponent,
        VrpPhotosComponent,
        VrpProgressBarComponent,
    ],
})
export class ComponentsModule { }
