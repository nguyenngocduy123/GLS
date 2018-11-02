import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VrpNotFoundComponent } from './vrp-not-found.component';

const routes: Routes = [
    { path: '', component: VrpNotFoundComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class VrpNotFoundRoutingModule { }
