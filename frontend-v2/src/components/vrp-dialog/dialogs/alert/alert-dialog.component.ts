import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'vrp-alert-dialog',
    templateUrl: './alert-dialog.component.html',
    styleUrls: ['./alert-dialog.component.scss'],
})
export class AlertDialogComponent {
    title: string;
    message: string;
    customData: any;
    closeButton: string = 'CLOSE';

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        Object.assign(this, this.data);
    }
}
