import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatSnackBar } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AlertDialogComponent } from '@components/vrp-dialog/dialogs/alert/alert-dialog.component';
import { ConfirmDialogComponent } from '@components/vrp-dialog/dialogs/confirm/confirm-dialog.component';
import { DynamicEditDialogComponent } from '@components/vrp-dialog/dialogs/dynamic-edit/dynamic-edit-dialog.component';
import { ErrorDialogComponent } from '@components/vrp-dialog/dialogs/error/error-dialog.component';
import { LoadingDialogComponent } from '@components/vrp-dialog/dialogs/loading/loading-dialog.component';
import { PromptDialogComponent } from '@components/vrp-dialog/dialogs/prompt/prompt-dialog.component';
import { SelectionDialogComponent } from '@components/vrp-dialog/dialogs/selection/selection-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import { LoadingSnackBarComponent } from '@components/vrp-dialog/dialogs/loading-snack-bar/loading-snack-bar.component';

@Injectable()
export class VrpDialogService {

    loadingSubject: Subject<any> = new Subject();

    translating: boolean = true;

    constructor(
        private _mdDialog: MatDialog,
        private _snackBarService: MatSnackBar,
        private _translate: TranslateService,
    ) { }

    alert(message: string, title: string = 'Alert', customData: any = undefined): Observable<any> {
        return this.open(AlertDialogComponent, {
            title: this._t(title),
            message: this._t(message),
            customData: customData,
            closeButton: this._t('CLOSE'),
        });
    }

    error(message: string, title: string = 'Error'): Observable<any> {
        return this.open(ErrorDialogComponent, {
            title: this._t(title),
            message: this._t(message),
            closeButton: this._t('CLOSE'),
        });
    }

    errorResponse(err: any): Observable<any> {
        console.error('openerrorResponse', err);
        const title: string = `${this._t('Error')} ${err.status}`;
        let message: string = (err.error && err.error.message) || err.error || 'Unknown error';

        if (err.status === 0) {
            message = this._t('CONNECTION_ERROR_MSG');

        } else if (err.status === 404) {
            message = this._t('NOT_FOUND_ERROR_MSG');
        }

        return this.open(ErrorDialogComponent, {
            title: this._t(title),
            message: message,
        });
        // return this.open(ErrorDialogComponent, { title: title, message: message.replace(/[\W_]+/g, ' ') });
    }

    confirm(message: string = 'Are you sure?', title: string = undefined, yesButtonText: string = 'YES', noButtonText: string = 'NO'): Observable<boolean> {
        return this.open(ConfirmDialogComponent, {
            title: this._t(title),
            message: this._t(message),
            acceptButton: this._t(yesButtonText),
            cancelButton: this._t(noButtonText),
        });
    }

    prompt(currentValue, message: string = 'Field to change', title: string = undefined, yesButtonText: string = 'YES', noButtonText: string = 'NO'): Observable<string> {
        return this.open(PromptDialogComponent, {
            title: this._t(title),
            message: this._t(message),
            acceptButton: this._t(yesButtonText),
            cancelButton: this._t(noButtonText),
            value: currentValue,
        });
    }

    openDynamicEdit(formElements: any[], target: any = undefined, title: string = undefined, nLayoutCols: number = 2): Observable<any> {
        const data = {
            title: this._t(title),
            acceptButton: this._t('OK'),
            cancelButton: this._t('CANCEL'),
            formElements: formElements, target: target, nLayoutCols: nLayoutCols,
        };
        return this.open(DynamicEditDialogComponent, data);
    }

    open(component, data: any): Observable<any> {
        const config = new MatDialogConfig();
        config.data = {};
        config.minWidth = '40%';
        config.maxWidth = '80%';
        Object.assign(config.data, data);
        return this._mdDialog.open(component, config).afterClosed();
    }

    openWithConfig(component, config: MatDialogConfig): Observable<any> {
        return this._mdDialog.open(component, config).afterClosed();
    }

    openProgressWithCancel(title: string = undefined): Observable<any> {
        return this.open(LoadingDialogComponent, { title: title, loadingSubject: this.loadingSubject });
    }

    openSelection(columns: any[], data: any[], title: string = undefined, rowClick: Function = undefined): Observable<any> {
        return this.open(SelectionDialogComponent, { title: title, data: data, columns: columns, rowClick: rowClick });
    }

    closeAll(): VrpDialogService {
        this._mdDialog.closeAll();
        return this;
    }

    openFileDialog(options, callback) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = false;
        options = options || {};

        if (options.accept) {
            fileInput.accept = options.accept;
        }

        fileInput.addEventListener('change', () => {
            const f = fileInput.files[0];
            const fileExt = f.name.substring(f.name.lastIndexOf('.') + 1).toLowerCase();

            const reader = new FileReader();
            reader.onload = (e: any) => {
                const content = e.target.result;
                callback(content, f.name, fileExt);
            };

            if (options.type === 'text') {
                reader.readAsText(f);
            } else if (options.type === 'binary') {
                reader.readAsBinaryString(f);
            } else {
                if (['csv', 'txt', 'json'].indexOf(fileExt) > -1) {
                    reader.readAsText(f);
                } else {
                    reader.readAsBinaryString(f);
                }
            }
        }, false);

        fileInput.click();
    }

    openLoadingSnackBar(e: Subject<string>) {
        return this._snackBarService.openFromComponent(LoadingSnackBarComponent, { data: e, horizontalPosition: 'left', verticalPosition: 'bottom' });
    }

    private _t(msg: string): string {
        return this.translating && msg ? this._translate.instant(msg) : msg;
    }
}

export const VRP_DIALOG_COMPONENTS = [
    AlertDialogComponent, ErrorDialogComponent, ConfirmDialogComponent, PromptDialogComponent,
    DynamicEditDialogComponent, LoadingDialogComponent, SelectionDialogComponent,
    LoadingSnackBarComponent,
];
