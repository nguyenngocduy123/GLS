import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
    selector: 'vrp-prompt-dialog',
    templateUrl: './prompt-dialog.component.html',
    styleUrls: ['./prompt-dialog.component.scss'],
})
export class PromptDialogComponent {

    title: string;
    message: string;
    value: string;
    cancelButton: string = 'CANCEL';
    acceptButton: string = 'SAVE';

    constructor(
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        Object.assign(this, this.data);
    }
}
