import { Component, HostListener, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve } from '@angular/router';
import { TdLoadingService } from '@covalent/core/loading';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';
import { get as _get } from 'lodash-es';

import { VrpDialogService } from '@components/vrp-dialog';
import { IVrpUser } from '@app/vrp-common/classes/vrp-user';
import { configTransform, configTranslate } from '@app/vrp-common/classes/vrp-configuration';
import { VrpUserRestService } from '@app/vrp-common/services/user-rest.service';
import { VrpUserDetailDialogComponent } from '@app/vrp-user-management/dialogs/user-detail/user-detail-dialog.component';
import { USER_MANAGEMENT_SIDENAVLIST, USER_MANAGEMENT_TABLE_CONFIG } from '@app/vrp-user-management/vrp-user-management.config';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Injectable()
export class VrpAllUsersResolve implements Resolve<IVrpUser[]> {

    constructor(
        private _userRest: VrpUserRestService,
    ) { }

    resolve(route: ActivatedRouteSnapshot) {
        return this._userRest.getAllUsers();
    }
}

@Component({
    selector: 'vrp-user-management',
    templateUrl: './user-management.component.html',
    styleUrls: ['./user-management.component.scss'],
})
export class VrpUserManagementComponent implements OnInit {

    title: string = 'All Users';
    users: IVrpUser[];
    filteredUsers: IVrpUser[];

    tableHeight: number = 500;

    readonly sideNavList: any[] = USER_MANAGEMENT_SIDENAVLIST;
    selectedNav: any;

    columns: any[] = configTranslate(configTransform(USER_MANAGEMENT_TABLE_CONFIG), this._translate);

    itemMenu: any[] = configTranslate([
        { label: 'Edit', click: (user) => { this.editUser(user); } },
        // { label: 'Enable/Disable', click: (user) => this.toggleUsers([user.username], _get(user, 'disabled', false) === false) },
        { label: 'Logout', click: (user) => this.logoutUsers([user.username]) },
        { label: 'Reset password', click: (user) => this.resetPasswordUsers([user.username]) },
        { label: 'Delete', click: (user) => this.deleteUsers([user.username]) },
    ], this._translate);

    selectActions: any[] = configTranslate([
        { tooltip: 'Logout', icon: 'exit_to_app', click: (users) => this.logoutUsers(users.map((u) => u.username)) },
        { tooltip: 'Reset password', icon: 'format_color_reset', click: (users) => this.resetPasswordUsers(users.map((u) => u.username)) },
        { tooltip: 'Delete', icon: 'delete', click: (users) => this.deleteUsers(users.map((u) => u.username)) },
        { tooltip: 'Disable', icon: 'visibility_off', click: (users) => this.toggleUsers(users.map((u) => u.username), true) },
    ], this._translate);

    tableActions: any[] = [
        { tooltip: 'Register New User', icon: 'add', click: () => { this.registerUser(); } },
    ];

    constructor(
        private _route: ActivatedRoute,
        private _loading: TdLoadingService,
        private _dialog: VrpDialogService,
        private _userRest: VrpUserRestService,
        private _translate: TranslateService,
        private _toast: VrpToastService,
    ) {
        this.selectedNav = this.sideNavList[0];
        this.users = this._route.snapshot.data['allUsers'];

        let firstLoad: boolean = true;

        this._route.queryParams.subscribe((p) => {
            if (p.index) {
                const selectedNav = this.sideNavList[p.index];
                if (selectedNav) {
                    // update selection buttons
                    if (!selectedNav.filter.disabled) {
                        this.selectActions[3] = { tooltip: 'Disable', icon: 'visibility_off', click: (users) => this.toggleUsers(users.map((u) => u.username), true) };
                        this.itemMenu[4] = { label: 'Disable', tooltip: 'Disable', click: (user) => this.toggleUsers([user.username], true) };
                    } else {
                        this.selectActions[3] = { tooltip: 'Enable', icon: 'visibility', click: (users) => this.toggleUsers(users.map((u) => u.username), false) };
                        this.itemMenu[4] = { label: 'Enable', tooltip: 'Enable', click: (user) => this.toggleUsers([user.username], false) };
                    }

                    this.selectedNav = selectedNav;
                    this.filterUsers();
                }
            } else if (firstLoad) {
                this.filterUsers();
            }

            firstLoad = false;
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit(): void {
        this.onResize();
    }

    filterUsers(): void {
        this.title = this.selectedNav.label;
        const f = this.selectedNav.filter;

        this.filteredUsers = this.users.filter((user: IVrpUser) => {
            let answer: boolean = true;
            if (f.role !== undefined) {
                answer = (user.role === f.role);
            }
            if (answer && f.disabled !== undefined) {
                answer = _get(user, 'disabled', false) === f.disabled;
            }
            return answer;
        });
    }

    load(forceRefresh: boolean = false) {
        this._loading.register('vrp-user-management.load');
        this._userRest.getAllUsers(forceRefresh).pipe(finalize(() => {
            this._loading.resolve('vrp-user-management.load');
        })).subscribe(
            (users) => {
                this.users = users;
                this.filterUsers();
            },
            (err) => this._dialog.errorResponse(err),
        );
    }

    editUser(user: IVrpUser) {
        this._dialog.open(VrpUserDetailDialogComponent, { user, allUsers: this.users }).subscribe((updatedUser) => {
            if (updatedUser) {
                console.log('VrpUserManagementComponent -> editUser -> updatedUser', updatedUser);
                this._loading.register('vrp-user-management.load');
                this._userRest.update(updatedUser)
                    .pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => {
                        this._toast.shortAlert('USER_MANAGEMENT.USER_SAVED_MSG');
                        Object.assign(user, updatedUser);
                        this.filterUsers();
                    }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    registerUser() {
        this._dialog.open(VrpUserDetailDialogComponent, { user: undefined, allUsers: this.users }).subscribe((updatedUser) => {
            if (updatedUser) {
                this._loading.register('vrp-user-management.load');
                this._userRest.create(updatedUser).pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => {
                        this._toast.shortAlert('USER_MANAGEMENT.USER_CREATED_MSG');
                        this.users.push(Object.assign({ modified_date: new Date() }, updatedUser));
                        this.filterUsers();
                    }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    resetPasswordUsers(userNames: string[]) {
        this._dialog.confirm('USER_MANAGEMENT.RESET_PASSWORD_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._loading.register('vrp-user-management.load');
                this._userRest.resetPassword(userNames)
                    .pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => this._toast.shortAlert('USER_MANAGEMENT.RESET_PASSWORD_COMPLETED_ALERT'),
                        (err) => this._dialog.errorResponse(err));
            }
        });
    }

    logoutUsers(usernames: string[]) {
        this._dialog.confirm('USER_MANAGEMENT.LOGOUT_USER_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._loading.register('vrp-user-management.load');
                this._userRest.logoutByUsernames(usernames)
                    .pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => {
                        this.users.filter((u) => usernames.includes(u.username)).forEach((u) => u.isOnline = false);
                        this._toast.shortAlert('USER_MANAGEMENT.LOGOUT_USER_COMPLETED_ALERT');
                    },
                        (err) => this._dialog.errorResponse(err));
            }
        });
    }

    deleteUsers(usernames: string[]) {
        this._dialog.confirm('USER_MANAGEMENT.DELETE_USER_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._loading.register('vrp-user-management.load');
                this._userRest.delete(usernames)
                    .pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => {
                        this.users = this.users.filter((u) => !usernames.includes(u.username));
                        this.filterUsers();
                        this._toast.shortAlert('USER_MANAGEMENT.DELETE_USER_COMPLETED_ALERT');
                    }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    toggleUsers(usernames: string[], toDisable: boolean) {
        console.log(this.filteredUsers, usernames);
        this._dialog.confirm(toDisable ? 'USER_MANAGEMENT.DISABLE_USER_CONFIRM_MSG' : 'USER_MANAGEMENT.ENABLE_USER_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._loading.register('vrp-user-management.load');
                this._userRest.toggleUsers(usernames, toDisable)
                    .pipe(finalize(() => this._loading.resolve('vrp-user-management.load')))
                    .subscribe(() => {
                        this.users.forEach((u) => {
                            if (usernames.includes(u.username)) {
                                u.disabled = toDisable;
                                u.disabled_date = toDisable ? new Date() : undefined;
                            }
                        });

                        this.filterUsers();
                        this._toast.shortAlert(toDisable ? 'USER_MANAGEMENT.DISABLE_USER_COMPLETED_ALERT' : 'USER_MANAGEMENT.ENABLE_USER_COMPLETED_ALERT');
                    },
                        (err) => this._dialog.errorResponse(err));
            }
        });
    }
}
