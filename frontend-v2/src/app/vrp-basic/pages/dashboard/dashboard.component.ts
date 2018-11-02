import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { configTransform, configTranslate } from '@app/vrp-common';
import { TdLoadingService } from '@covalent/core/loading';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { Problem } from '@app/vrp-basic/classes/problem';
import { VrpBasicDialogService } from '@app/vrp-basic/services/basic-dialog.service';
import { VrpProblemRestService } from '@app/vrp-basic/services/problem-rest.service';
import { DASHBOARD_TABLE_CONFIG, PROBLEM_PROPERTIES_CONFIG } from '@app/vrp-basic/vrp-basic.config';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class VrpDashboardComponent implements OnInit {

    tableHeight: number = 5;
    selectedRows = [];

    columns: any[] = configTranslate(configTransform(DASHBOARD_TABLE_CONFIG), this._translate);

    data: any[];

    itemActions: any[] = configTranslate([
        { tooltip: 'Open', icon: 'launch', click: (item) => this.openProblem(item) },
    ], this._translate);

    selectActions: any[] = configTranslate([
        { label: 'Delete', icon: 'delete', click: (items) => this.deleteProblems(items) },
    ], this._translate);

    toolbarButtons: any[] = configTranslate([
        { label: 'Create Model', icon: 'add', click: () => this.createProblem() },
        { label: 'Import Model', icon: 'file_upload', click: () => this.importProblem() },
        { label: 'Refresh', icon: 'refresh', click: () => this.load(true) },
    ], this._translate);

    constructor(
        private _problemRest: VrpProblemRestService,
        private _dialog: VrpBasicDialogService,
        private _loading: TdLoadingService,
        private _router: Router,
        private _translate: TranslateService,
        private _authentication: VrpAuthenticationService,
        private _toast: VrpToastService,
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = (window.innerHeight - 105);
    }

    ngOnInit() {
        this.onResize();
        this.load(true);
    }

    load(forceRefresh: boolean = false) {
        this._loading.register('vrp-dashboard.load');
        this._problemRest.getAbstractProblem(forceRefresh)
            .pipe(finalize(() => this._loading.resolve('vrp-dashboard.load')))
            .subscribe(
                (res) => this.data = res,
                (err) => {
                    this._router.navigate(['login']);
                    this._dialog.errorResponse(err);
                });
    }

    openProblem(p: any) {
        // this._dialog.openConfirm(`Open model ${p.name} (${p._id})?`).subscribe((yes) => {
        this._router.navigate(['cvrp', 'problem-detail', p._id], { queryParams: { viewMode: 'table', tableName: 'vehicles' } });
        // });
    }

    createProblem() {
        this._dialog.openDynamicEdit(configTranslate(PROBLEM_PROPERTIES_CONFIG, this._translate), {}, 'Create model').subscribe((newValue) => {
            if (newValue) {
                this._createProblem(newValue);
            }
        });
    }

    deleteProblems(items) {
        this._dialog.confirm('DASHBOARD.DELETE_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._problemRest.delete(items.map((p) => p._id)).subscribe((res) => {
                    this.data = this.data.filter((a) => items.indexOf(a) === -1);
                    this._toast.shortAlert('Delete succesfully');
                }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    importProblem() {
        this._dialog.openFileDialog({ accept: '.json', type: 'text' },
            (jsonString, fileName) => {
                try {
                    this._createProblem(JSON.parse(jsonString));
                } catch (err) {
                    this._dialog.error('INVALID_FILE_FORMAT_ERR');
                }
            });
    }

    private _createProblem(problem) {
        const newProblem = new Problem();

        Object.assign(newProblem, problem);
        newProblem.username = [this._authentication.getUserName()];
        console.debug('newProblem', newProblem);

        this._problemRest.create(newProblem).subscribe((res) => {
            this._dialog.confirm('DASHBOARD.OPEN_AFTER_CREATED_CONFIRM_MSG').subscribe((answer) => {
                if (answer) {
                    this._router.navigate(['cvrp', 'problem-detail', res['_id']], { queryParams: { viewMode: 'table', tableName: 'vehicles' } });
                } else {
                    this.load(true);
                }
            });
        }, (err) => this._dialog.errorResponse(err));
    }
}
