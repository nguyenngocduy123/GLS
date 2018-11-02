/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { CompleteJobDetailsPage } from './complete-job-details';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
    declarations: [
        CompleteJobDetailsPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(CompleteJobDetailsPage),
    ],
})
export class CompleteJobDetailsPageModule { }
