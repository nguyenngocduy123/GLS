/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { OfflineJobModalPage } from './offline-job-modal';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
    declarations: [
        OfflineJobModalPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(OfflineJobModalPage),
    ],
})
export class OfflineJobModalPageModule { }
