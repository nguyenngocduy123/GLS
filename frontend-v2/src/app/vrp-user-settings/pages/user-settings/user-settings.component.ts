import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { get as _get } from 'lodash-es';

import { VrpDialogService } from '@components/vrp-dialog';
import { VrpFileService } from '@app/vrp-common/services/file.service';
import { VrpUserRestService } from '@app/vrp-common/services/user-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpChangePasswordDialogComponent } from '@app/vrp-user-settings/dialogs/change-password/change-password-dialog.component';
import { UserNotificationDialogComponent } from '@app/vrp-user-settings/dialogs/user-notification/user-notification-dialog.component';
import { THEME_LIST, GEOCODING_SERVICE_LIST } from '@app/vrp-user-management/vrp-user-management.config';
import { USER_ENVIRONMENT } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-user-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.scss'],
})
export class VrpUserSettingsComponent {

    user: any = {};

    readonly themeList = THEME_LIST;
    readonly geocodingServiceList = GEOCODING_SERVICE_LIST;

    constructor(
        private _userRest: VrpUserRestService,
        private _dialog: VrpDialogService,
        private _authentication: VrpAuthenticationService,
        private _router: Router,
        private _file: VrpFileService,
        private _toast: VrpToastService,
    ) {
        try {
            this.user = this._authentication.user;
        } catch (err) {
            console.error('VrpUserSettings', err);
            this._router.navigate(['login']);
        }
    }

    get language(): string {
        return localStorage.getItem('language') || 'en';
    }

    // Theme toggle
    get activeTheme(): string {
        const value = this._authentication.theme;
        const theme = this.themeList.find((option) => (option.value === value)) || { label: USER_ENVIRONMENT.THEME.defaultValue };
        return theme['label'];
    }

    get primaryGeocodingService(): any {
        const value = this._authentication.primaryGeocodingService;
        const service = this.geocodingServiceList.find((option) => (option.value === value)) || { label: USER_ENVIRONMENT.PRIMARY_GEOCODING_SERVICE.defaultValue };
        return service['label'];
    }

    set primaryGeocodingService(option: any) {
        this._authentication.primaryGeocodingService = option.value;
    }

    setActiveTheme(option: any) {
        this._authentication.theme = option.value;
    }

    changeLanguage() {
        this._dialog.confirm('USER_SETTING.LANGUAGE_CHANGE_CONFIRM_ALERT').subscribe((yes) => {
            if (yes) {
                localStorage.setItem('language', this.language === 'cn' ? 'en' : 'cn');
                window.location.reload();
            }
        });
    }

    updateFullname() {
        this._dialog.prompt(this.user.fullname, 'Fullname', 'Change Fullname').subscribe((newValue) => {
            if (newValue) {
                this._update({ username: this.user.username, fullname: newValue });
            }
        });
    }

    updateEmail() {
        this._dialog.openDynamicEdit([{ label: 'Email', type: 'email', name: 'email' }], this.user, 'Change Email').subscribe((newValue) => {
            if (newValue && newValue.email) {
                this._update({ username: this.user.username, email: newValue.email });
            }
        });
    }

    updatePassword() {
        this._dialog.open(VrpChangePasswordDialogComponent, undefined).subscribe((user) => {
            if (user) {
                this._toast.shortAlert('USER_SETTING.PASSWORD_UPDATED_SUCCESS_MSG');
            }
        });
    }

    updateNotification() {
        this._dialog.open(UserNotificationDialogComponent, {
            dataToastNotification: this._authentication.dataToastNotification,
            jobBellNotification: this._authentication.jobBellNotification,
            msgToastNotification: this._authentication.msgToastNotification,
            msgBellNotification: this._authentication.msgBellNotification,
        }).subscribe((data) => {
            if (data) {
                this._updateNotificationStatus(data);
            }
        });
    }

    updateCustomData() {
        this._dialog.openFileDialog({ accept: '.json' }, (data, fileName, fileExt) => {
            try {
                const p = JSON.parse(data);
                const uploadedData = { vehicles: p.vehicles, vehicle_types: p.vehicle_types, items: p.items };
                this._update({ username: this.user.username, data: uploadedData });
            } catch (err) {
                this._dialog.error('INVALID_FILE_FORMAT_ERR');
            }
        });
    }

    downloadCustomData() {
        this._file.saveAsJson(this.user.data, `userData-${this.user.username}.json`);
    }

    private _update(d) {
        this._userRest.update(d).subscribe((res) => {
            Object.assign(this.user, d);
            this._toast.shortAlert('USER_SETTING.USER_INFORMATION_UPDATED_SUCCESS_MSG');
        }, (err) => this._dialog.errorResponse(err));
    }

    private _updateNotificationStatus(data): void {
        this._authentication.dataToastNotification = data.dataToastNotification;
        this._authentication.jobBellNotification = data.jobBellNotification;
        this._authentication.msgToastNotification = data.msgToastNotification;
        this._authentication.msgBellNotification = data.msgBellNotification;
    }
}
