import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { get as _get } from 'lodash-es';

@Component({
    selector: 'vrp-dynamic-edit-dialog',
    templateUrl: './dynamic-edit-dialog.component.html',
    styleUrls: ['./dynamic-edit-dialog.component.scss'],
})
export class DynamicEditDialogComponent {

    title: string;
    elements: any[] = [[]];
    form: any = {};
    target: any;

    cancelButton: string;
    acceptButton: string;

    constructor(
        private _dialogRef: MatDialogRef<DynamicEditDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        this.title = data.title;
        this.target = data.target;

        this.cancelButton = data.cancelButton || 'CANCEL';
        this.acceptButton = data.acceptButton || 'OK';

        const array = [[]];

        data.formElements.forEach((e) => {
            if (e.label && e.name) {
                const t: any = {
                    name: e.name,
                    label: e.label,
                    required: e.required,
                    type: e.type,
                    selections: e.selections,
                    selectionLabels: e.selectionLabels || e.selections,
                    default: (_get(this.target, e.data || e.name)) || e.default,
                };

                this.form[t.name] = (e.type === 'number' && e.scale) ? t.default * e.scale : t.default;
                const i = (e.rowIndex && e.rowIndex > 0) ? e.rowIndex : 0;
                if (!array[i]) {
                    array[i] = [];
                }
                array[i].push(t);
            }
        });

        this.elements = array;

        console.debug('DynamicEditDialogComponent - constructor', this.elements, this.form);
    }

    save() {
        this.data.formElements.forEach((e) => {
            if (e.type === 'number' && e.scale) {
                this.form[e.name] /= e.scale;
            }
        });
        this._dialogRef.close(this.form);
    }
}
