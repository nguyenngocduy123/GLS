import { Component, Inject, ChangeDetectorRef } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material';
import { Subject } from 'rxjs/Subject';

@Component({
    selector: 'vrp-loading-snackbar',
    templateUrl: './loading-snack-bar.component.html',
    styleUrls: ['./loading-snack-bar.component.scss'],
})
export class LoadingSnackBarComponent {

    message: string;

    constructor(
        private _snackBarRef: MatSnackBarRef<LoadingSnackBarComponent>,
        private _cd: ChangeDetectorRef,
        @Inject(MAT_SNACK_BAR_DATA) msgSubject: Subject<string>,
    ) {
        msgSubject.subscribe((msg: string) => {
            this.message = msg;
            this._cd.markForCheck();
        });
    }

    cancel() {
        this._snackBarRef.closeWithAction();
    }
}
