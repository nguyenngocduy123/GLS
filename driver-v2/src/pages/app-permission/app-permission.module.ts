/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { AppPermissionPage } from './app-permission';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
    declarations: [
        AppPermissionPage,
    ],
    imports: [
        ComponentsModule,
        IonicPageModule.forChild(AppPermissionPage),
    ],
})
export class AppPermissionPageModule { }
