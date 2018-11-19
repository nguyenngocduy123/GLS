import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomFormsModule } from 'ngx-custom-validators';

import { VrpChangePasswordComponent } from './components/change-password/change-password.component';
import { VrpForceChangePasswordComponent } from './pages/force-change-password/force-change-password.component';
import { VrpUserSettingsComponent } from './pages/user-settings/user-settings.component';
import { UserNotificationDialogComponent } from './dialogs/user-notification/user-notification-dialog.component';
import { VrpChangePasswordDialogComponent } from './dialogs/change-password/change-password-dialog.component';

import { AppSharedModule } from '@app/app-shared.module';

const VRP_USER_SETTINGS_ROUTES: Routes = [
    { path: '', component: VrpUserSettingsComponent },
    { path: 'change-password', component: VrpForceChangePasswordComponent },
];

@NgModule({
    imports: [
        AppSharedModule,
        CustomFormsModule, // to validate form
        RouterModule.forChild(VRP_USER_SETTINGS_ROUTES),
    ],
    declarations: [
        VrpUserSettingsComponent,
        VrpChangePasswordDialogComponent,
        VrpChangePasswordComponent,
        VrpForceChangePasswordComponent,
        UserNotificationDialogComponent,
    ],
    entryComponents: [
        VrpChangePasswordDialogComponent,
        UserNotificationDialogComponent,
    ],
})
export class VrpUserSettingsModule { }
