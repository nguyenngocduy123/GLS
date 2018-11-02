import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { VrpAllUserGroupsResolve, VrpUserGroupManagementComponent } from './components/user-group-management/user-group-management.component';
import { VrpAllUsersResolve, VrpUserManagementComponent } from './components/user-management/user-management.component';
import { VrpUserDetailDialogComponent } from './dialogs/user-detail/user-detail-dialog.component';

import { AppSharedModule } from '@app/app-shared.module';

const VRP_USER_MANAGEMENT_ROUTES: Routes = [
    { path: '', component: VrpUserManagementComponent, resolve: { allUsers: VrpAllUsersResolve } },
    { path: 'usergroup', component: VrpUserGroupManagementComponent, resolve: { allUserGroups: VrpAllUserGroupsResolve } },
];

@NgModule({
    imports: [
        AppSharedModule,
        RouterModule.forChild(VRP_USER_MANAGEMENT_ROUTES),
    ],
    declarations: [
        VrpUserManagementComponent,
        VrpUserDetailDialogComponent,
        VrpUserGroupManagementComponent,
    ],
    providers: [
        VrpAllUsersResolve,
        VrpAllUserGroupsResolve,
    ],
    entryComponents: [
        VrpUserDetailDialogComponent,
    ],
})
export class VrpUserManagementModule { }
