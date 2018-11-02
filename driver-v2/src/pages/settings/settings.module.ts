/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { SettingPage } from './settings';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
    declarations: [
        SettingPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(SettingPage),
    ],
})
export class SettingPageModule { }
