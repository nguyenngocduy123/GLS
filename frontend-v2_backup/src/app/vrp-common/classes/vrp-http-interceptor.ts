import { HttpErrorResponse, HttpResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpXsrfTokenExtractor } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { IDLE_TIMEOUT_DURATION } from '@app/vrp-common/vrp-common.config';
import { CookieExpiryService } from '@app/vrp-common/services/cookie-expiry.service';

@Injectable()
export class VrpHttpInterceptor implements HttpInterceptor {
    private timer: number;

    constructor(
        private tokenExtractor: HttpXsrfTokenExtractor,
        private _cookie: CookieExpiryService,
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const headerName = 'x-xsrf-token';
        const token = this.tokenExtractor.getToken() as string;

        if (token && !req.headers.has(headerName)) {
            req = req.clone({ headers: req.headers.set(headerName, token) });
        }

        const changedReq = req.clone({ withCredentials: true });
        return next.handle(changedReq).pipe(
            tap((response) => {
                if (response instanceof HttpResponse) {
                    this.restartTimer(); // only restart if request is successful
                }
            }, (err) => {
                if (err instanceof HttpErrorResponse) {
                    if (err.status === 401) { // unauthorized, token is expired or invalid
                        console.error('Unauthorized, token is expired or invalid');
                        localStorage.removeItem('user');
                    }
                }
            }),
        );
    }

    restartTimer() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.onSessionExpired(), IDLE_TIMEOUT_DURATION * 1000);
    }

    onSessionExpired() {
        console.log('session expired!!!');
        this._cookie.sessionExpired.next(true);
    }
}
