import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VrpProblemDetailResolve, VrpProblemDetailComponent } from './vrp-problem-detail.component';

const routes: Routes = [
    { path: ':problemId', component: VrpProblemDetailComponent, resolve: { problem: VrpProblemDetailResolve } },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class VrpProblemDetailRoutingModule { }
