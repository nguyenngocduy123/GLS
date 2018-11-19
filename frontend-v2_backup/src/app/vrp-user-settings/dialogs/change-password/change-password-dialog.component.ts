import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material';

@Component({
    selector: 'vrp-change-password-dialog',
    templateUrl: './change-password-dialog.component.html',
    styleUrls: ['./change-password-dialog.component.scss'],
})
export class VrpChangePasswordDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<VrpChangePasswordDialogComponent>,
    ) { }
}
