import { VrpControllerGuard } from './../vrp-common/guards/controller.guard';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { VrpAdminGuard } from '@app/vrp-common/guards/admin.guard';
import { VrpAuthenticationGuard, VrpPlannerGuard } from '@app/vrp-common/guards';
import { VrpMainComponent } from '@app/vrp-common/components/main/main.component';

const routes: Routes = [
    { path: 'login', loadChildren: '@app/vrp-login/vrp-login.module#VrpLoginModule' },
    {
        path: '', component: VrpMainComponent, canActivate: [VrpAuthenticationGuard],
        children: [
            { path: '', redirectTo: 'planner/monitor/progress', pathMatch: 'full' },
            { path: 'planner', canLoad: [VrpPlannerGuard], canActivate: [VrpPlannerGuard], loadChildren: '@app/planner/planner.module#PlannerModule' },
            { path: 'settings', canLoad: [VrpAuthenticationGuard], loadChildren: '@app/vrp-user-settings/vrp-user-settings.module#VrpUserSettingsModule' },
            { path: 'cvrp', canLoad: [VrpAuthenticationGuard], loadChildren: '@app/vrp-basic/vrp-basic.module#VrpBasicModule' },
            { path: 'user-management', canLoad: [VrpAdminGuard], canActivate: [VrpAdminGuard], loadChildren: '@app/vrp-user-management/vrp-user-management.module#VrpUserManagementModule' },
            { path: 'controller', canLoad: [VrpControllerGuard], canActivate: [VrpControllerGuard], loadChildren: '@app/planner/planner.module#PlannerModule' },
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
export class AppPlannerRoutingModule { }
