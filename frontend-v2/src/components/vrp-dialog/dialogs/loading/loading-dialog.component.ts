import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'vrp-loading-dialog',
    templateUrl: './loading-dialog.component.html',
    styleUrls: ['./loading-dialog.component.scss'],
})
export class LoadingDialogComponent {
    title: string;
    message: any = { text: 'Progressing. Please wait.', finished: false };

    constructor(
        @Inject(MAT_DIALOG_DATA) private e: any,
    ) {
        this.title = this.e.title;
        this.e.loadingSubject.subscribe((msg) => {
            this.message = msg;
        });
    }
}
