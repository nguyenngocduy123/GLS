import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanLoad, Route, Router, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';

@Injectable({ providedIn: 'root' })
export class VrpControllerGuard implements CanLoad, CanActivate {

    constructor(
        private _authentication: VrpAuthenticationService,
        private _router: Router,
    ) { }

    canLoad(route: Route): boolean | Observable<boolean> | Promise<boolean> {
        return (this._authentication.isController()) ? true : this._authentication.isLoggedIn().pipe(
            catchError((err) => {
                this._router.navigate(['login']);
                return of(false);
            }),
        );
    }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
        console.log('VrpControllerGuard -> canActivate', this._authentication.user, this._authentication.getDefaultUrlSegment());
        if (this._authentication.isController()) {
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
