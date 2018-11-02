/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { SignaturePadModule } from 'angular2-signaturepad';

import { PodSignaturePage } from './pod-signature';
import { ComponentsModule } from '../../../../components/components.module';

@NgModule({
    declarations: [PodSignaturePage],
    imports: [
        ComponentsModule,
        SignaturePadModule,
        IonicPageModule.forChild(PodSignaturePage),
    ],
})
export class PodSignaturePageModule {}
