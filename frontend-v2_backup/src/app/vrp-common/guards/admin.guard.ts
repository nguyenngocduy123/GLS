import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Route, CanLoad, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';

@Injectable({ providedIn: 'root' })
export class VrpAdminGuard implements CanActivate, CanLoad {

    constructor(
        private _authentication: VrpAuthenticationService,
        private _router: Router,
    ) { }

    canLoad(route: Route): boolean | Observable<boolean> | Promise<boolean> {
        console.log('VrpAdminGuard -> canLoad -> this._authentication.isAdmin()', this._authentication.user);
        return (this._authentication.isAdmin()) ? true : this._authentication.isLoggedIn().pipe(
            catchError((err) => {
                this._router.navigate(['login']);
                return of(false);
            }),
        );
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        console.log('VrpAdminGuard -> canActivate -> this._authentication.isAdmin()', this._authentication.user);

        if (this._authentication.isAdmin()) {
            if (this._authentication.isChangePasswordRequired()) {
                this._router.navigate(['settings', 'change-password']);
                return false;
            } else {
                return true;
            }
        } else {
            this._router.navigate(this._authentication.getDefaultUrlSegment());
            return false;
        }
    }
}
