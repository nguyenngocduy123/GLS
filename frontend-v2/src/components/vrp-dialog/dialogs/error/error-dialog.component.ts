import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'vrp-error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent {

    public title: string = 'Error';
    public message: string = 'You need to provide a message';
    public closeButton: string = 'CLOSE';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
        Object.assign(this, data);
    }
}
