import { Component, Inject } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

@Component({
    selector: 'vrp-user-notification-dialog',
    templateUrl: './user-notification-dialog.component.html',
    styleUrls: ['./user-notification-dialog.component.scss'],
})
export class UserNotificationDialogComponent {

    f: FormGroup;

    constructor(
        private _dialogRef: MatDialogRef<UserNotificationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        const jobBellNotification = new FormControl('', []);
        const dataToastNotification = new FormControl('', []);
        const msgBellNotification = new FormControl('', []);
        const msgToastNotification = new FormControl('', []);
        this.f = new FormGroup({ jobBellNotification, dataToastNotification, msgBellNotification, msgToastNotification });

        if (data) {
            this.f.patchValue(data);
        }
    }

    save(value) {
        this._dialogRef.close(value);
    }
}
