import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VrpMainComponent } from '@app/vrp-common/components/main/main.component';
import { VrpAuthenticationGuard, VrpAdminGuard } from '@app/vrp-common/guards';

const routes: Routes = [
    { path: 'login', loadChildren: '@app/vrp-login/vrp-login.module#VrpLoginModule' },
    {
        path: '', component: VrpMainComponent, canActivate: [VrpAuthenticationGuard],
        children: [
            { path: '', redirectTo: 'cvrp', pathMatch: 'full' },
            { path: 'settings', canLoad: [VrpAuthenticationGuard], loadChildren: '@app/vrp-user-settings/vrp-user-settings.module#VrpUserSettingsModule' },
            { path: 'cvrp', canLoad: [VrpAuthenticationGuard], loadChildren: '@app/vrp-basic/vrp-basic.module#VrpBasicModule' },
            { path: 'user-management', canLoad: [VrpAdminGuard], canActivate: [VrpAdminGuard], loadChildren: '@app/vrp-user-management/vrp-user-management.module#VrpUserManagementModule' },
        ],
    },
    { path: '404', loadChildren: '@app/vrp-common/pages/not-found/vrp-not-found.module#VrpNotFoundModule' },
    { path: '**', redirectTo: '/404' },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { useHash: true }),
    ],
    exports: [
        RouterModule,
    ],
})
export class AppBasicRoutingModule { }
