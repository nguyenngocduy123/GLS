/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { NextDayJobsPage } from './next-day-jobs';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
    declarations: [
        NextDayJobsPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(NextDayJobsPage),
    ],
})
export class NextDayJobsPageModule { }
