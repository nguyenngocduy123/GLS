import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppSharedModule } from '@app/app-shared.module';
import { VrpLoginComponent } from './components/login/login.component';

const VRP_LOGIN_ROUTES: Routes = [
    { path: '', component: VrpLoginComponent },
];

@NgModule({
    imports: [
        AppSharedModule,
        RouterModule.forChild(VRP_LOGIN_ROUTES),
    ],
    declarations: [
        VrpLoginComponent,
    ],
})
export class VrpLoginModule { }
