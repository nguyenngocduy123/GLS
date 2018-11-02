/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { NgModule } from '@angular/core';
import { SafePipe } from './safe/safe';

@NgModule({
    declarations: [
        SafePipe,
    ],
    exports: [
        SafePipe,
    ],
})
export class PipesModule { }
