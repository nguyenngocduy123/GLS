import { Component, OnDestroy } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterEvent } from '@angular/router';
import { MatDialog } from '@angular/material';
import { VrpDialogService } from '@components/vrp-dialog';
import { TdLoadingService } from '@covalent/core/loading';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { configTranslate } from '@app/vrp-common/classes/vrp-configuration';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpWebsocketService } from '@app/vrp-common/services/websocket.service';
import { CookieExpiryService } from '@app/vrp-common/services/cookie-expiry.service';
import { USER_DROPDOWN_MENU, IDLE_TIMEOUT_DURATION } from '@app/vrp-common/vrp-common.config';

@Component({
    selector: 'vrp-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class VrpMainComponent implements OnDestroy {

    readonly version: string = '1.3.6';

    user: any;

    userDropdownMenu: any[] = [];

    _subscriptions: any[] = [];

    constructor(
        private _router: Router,
        private _authentication: VrpAuthenticationService,
        private _loading: TdLoadingService,
        private _socket: VrpWebsocketService,
        private _dialog: VrpDialogService,
        private _translate: TranslateService,
        private _cookie: CookieExpiryService,
        private dialogRef: MatDialog,
    ) {
        this.user = this._authentication.user;
        this.userDropdownMenu = this._getDropdownMenu();
        this._router.events.subscribe((event: RouterEvent) => this._navigationInterceptor(event));
        this._socket.connect();

        this._socket.on('logout', () => {
            if (this._authentication.user) {
                this._dialog.alert('MAIN.FORCE_LOG_OFF_BY_ADMIN_ALERT').subscribe((yes) => this._logout());
            }
        });

        this._setUpTimeOutToStayAlive();
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._socket.removeAllListeners();
        this._socket.disconnect();
    }

    // Theme toggle
    get activeTheme(): string {
        return this._authentication.theme;
    }

    logout() {
        this._dialog.confirm('MAIN.LOG_OFF_CONFIRMATION_ALERT').subscribe((yes) => {
            if (yes) {
                this._logout();
            }
        });
    }

    private _setUpTimeOutToStayAlive() {
        this._subscriptions.push(
            this._cookie.sessionExpired.subscribe((done) => {
                console.log('VrpMainComponent ->  -> onCookieExpiry', done);
                this._logout(); // logout from current session
                this._dialog.alert(`You are inactive for more than ${IDLE_TIMEOUT_DURATION} seconds. Your session has been expired.`).subscribe(); // alert
            }),
        );
    }

    private _logout() {
        this.dialogRef.closeAll();
        this._authentication.logout()
            .pipe(finalize(() => this._router.navigate(['login'])))
            .subscribe(() => {
            }, (err) => console.error(err));
    }

    // Shows and hides the loading spinner during RouterEvent changes
    private _navigationInterceptor(event: RouterEvent) {
        if (event instanceof NavigationStart) {
            this._loading.register();
        }
        if (event instanceof NavigationEnd) {
            this._loading.resolve();
        }

        // Set loading state to false in both of the below events to hide the spinner in case a request fails
        if (event instanceof NavigationCancel) {
            this._loading.resolve();
        }

        if (event instanceof NavigationError) {
            this._loading.resolve();
        }
    }

    private _getDropdownMenu() {
        let dropdownMenuName: string = this.user.role;

        if (this._authentication.isRestrictedPlanner()) {
            dropdownMenuName = 'restricted_planner';
        }

        return configTranslate(USER_DROPDOWN_MENU[dropdownMenuName] || USER_DROPDOWN_MENU.default, this._translate);
    }
}
