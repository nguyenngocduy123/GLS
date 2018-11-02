import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class VrpToastService {

    constructor(
        private _snackBarService: MatSnackBar,
        private _translate: TranslateService,
    ) { }

    shortAlert(message: string, err: any = undefined) {
        let _msg = this._t(message);
        let _duration = 3000;
        if (err && err.error) {
            _duration = 5000;
            _msg = `❌ ${(err.error instanceof Array ? err.error[0] : err.error)}`;
        }
        this._snackBarService.open(_msg, 'Dismiss', { panelClass: ['text-break'], duration: _duration });
    }

    private _t(msg: string): string {
        return msg ? this._translate.instant(msg) : msg;
    }
}
