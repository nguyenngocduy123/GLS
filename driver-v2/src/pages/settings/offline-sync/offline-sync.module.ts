/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { OfflineSyncPage } from './offline-sync';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
    declarations: [
        OfflineSyncPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(OfflineSyncPage),
    ],
})
export class OfflineSyncPageModule { }
