import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'vrp-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
})
export class ConfirmDialogComponent {
    message: string = 'Are you sure?';
    title: string;
    cancelButton = 'NO';
    acceptButton = 'YES';

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        Object.assign(this, this.data);
    }
}
