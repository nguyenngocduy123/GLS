import { Component, HostListener, OnInit, ViewChild, Injectable } from '@angular/core';
import { ActivatedRoute, Resolve, Router, ActivatedRouteSnapshot } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TdLoadingService } from '@covalent/core/loading';
import { Subject } from 'rxjs/Rx';
import { finalize } from 'rxjs/operators';

import { VrpTableComponent } from '@components/vrp-table';
import { VrpExcelService, VrpFileService, VrpWebsocketService } from '@app/vrp-common';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { VrpSolutionDetailComponent } from '@app/vrp-common/pages/solution-detail/vrp-solution-detail.component';
import { Problem } from '@app/vrp-basic/classes/problem';
import { VrpBasicDialogService } from '@app/vrp-basic/services/basic-dialog.service';
import { VrpProblemRestService } from '@app/vrp-basic/services/problem-rest.service';
import { PROBLEM_PROPERTIES_CONFIG, PROBLEMDETAIL_NAVLIST_CONFIG, PROBLEMDETAIL_TABLE_CONFIG } from '@app/vrp-basic/vrp-basic.config';

@Injectable()
export class VrpProblemDetailResolve implements Resolve<Problem> {

    constructor(
        private _problemRest: VrpProblemRestService,
    ) { }

    resolve(route: ActivatedRouteSnapshot) {
        const problemId: string = route.params.problemId;
        return this._problemRest.get(problemId);
    }
}

@Component({
    selector: 'vrp-problem-detail',
    templateUrl: './vrp-problem-detail.component.html',
    styleUrls: ['./vrp-problem-detail.component.scss'],
})
export class VrpProblemDetailComponent implements OnInit {

    private _datePipe = new DatePipe('en-US');

    title: string = 'Unamed';

    @ViewChild('vrpSolution') vrpSolution: VrpSolutionDetailComponent;
    @ViewChild('vrpTable') vrpTable: VrpTableComponent;

    problem: Problem;

    pageHeight: number;

    tableHeight: number = 500;
    tableData: any[] = [];
    tableName: string;

    readonly tableColumns: any = PROBLEMDETAIL_TABLE_CONFIG;

    tableActions: any[] = [
        { tooltip: 'New Row', icon: 'add', click: () => this.editItem() },
    ];

    tableItemActions: any[] = [
        { tooltip: 'Open', icon: 'launch', click: (item) => this.editItem(item) },
    ];

    tableList: any[] = PROBLEMDETAIL_NAVLIST_CONFIG;

    isChanged: boolean = false;

    toolbarDropdownMenu: any[] = [
        { label: 'Configure', icon: 'edit', click: () => { this.configure(); } },
        { label: 'Geocode', icon: 'my_location', click: () => this.geocode() },
        { label: 'Import', icon: 'file_upload', click: () => { this.import(); } },
        { label: 'Export to JSON', icon: 'file_download', click: () => { this.export('json'); } },
        // { label: 'Import from Excel', icon: 'file_upload', click: () => { this.importProblemFromExcel(); } },
        { label: 'Export to Excel', icon: 'file_download', click: () => { this.export('xlsx'); } },
        { label: 'Distance matrix CSV', icon: 'straighten', click: () => { this.queryDistanceMatrix(); } },
    ];

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _socket: VrpWebsocketService,
        private _loading: TdLoadingService,
        private _problemRest: VrpProblemRestService,
        private _dialog: VrpBasicDialogService,
        private _file: VrpFileService,
        private _excel: VrpExcelService,
        private _authentication: VrpAuthenticationService,
    ) { }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.pageHeight = window.innerHeight - 65;
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit() {
        this.onResize();
        this.problem = this._route.snapshot.data['problem'];
        console.debug('ngOnInit - problem', this.problem);
        this._route.queryParams.subscribe((queryParams: any) => {
            if (queryParams.tableName) {
                this.tableName = queryParams.tableName;
                if (queryParams.tableName !== 'map') {
                    // console.log('queryParams', this.tableName, this.tableColumns[this.tableName]);
                    this.tableData = this.problem && this.tableName && this.problem[this.tableName];
                }
            }
        });
    }

    load(forceRefresh: boolean = false) {
        this._loading.register('vrp-problem-detail.load');
        this._problemRest.get(this.problem._id, forceRefresh)
            .pipe(finalize(() => this._loading.resolve('vrp-problem-detail.load')))
            .subscribe((p: Problem) => {
                this.problem = p;
                this.tableData = this.problem && this.problem[this.tableName];
            },
                (err) => this._dialog.errorResponse(err));
    }

    save() {
        this._loading.register('vrp-problem-detail.load');
        this._problemRest.update(this.problem._id, this.problem)
            .pipe(finalize(() => this._loading.resolve('vrp-problem-detail.load')))
            .subscribe(() => {
                this.isChanged = false;
                this._dialog.alert('PROBLEM_DETAIL.MODEL_SAVED_MSG').subscribe(() => this.load(true));
            }, (err) => this._dialog.errorResponse(err));
    }

    configure() {
        this._dialog.openDynamicEdit(PROBLEM_PROPERTIES_CONFIG, this.problem).subscribe((newValues) => {
            if (newValues) {
                Object.assign(this.problem, newValues);
                this.save();
            }
        });
    }

    import() {
        const problem = this.problem;
        this._dialog.openFileDialog({ accept: '.xlsx,.xls,.json' }, (data, fileName, fileExt) => {
            try {
                if (fileExt === 'json') {
                    const importedProblem = JSON.parse(data);
                    delete importedProblem._id;
                    Object.assign(problem, { solutions: [] }, importedProblem);
                    this.isChanged = true;
                    this.tableData = this.problem && this.problem[this.tableName];
                    // if (this.vrpTable) {
                    // 	this.vrpTable.filter();
                    // 	this.vrpTable.refresh();
                    // }
                    this._dialog.alert('PROBLEM_DETAIL.FILE_IMPORT_COMPLETED_MSG');
                } else if (['xlsx', 'xls'].indexOf(fileExt) > -1) {
                    this._loading.register('vrp-problem-detail.load');
                    const raw = this._excel.workbookToJson(data, this.tableColumns);
                    console.log('VrpProblemDetailComponent -> import -> raw', raw);
                    Object.assign(problem, { solutions: [] }, raw);
                    problem.readFromAddresses(); // map address , hacky
                    this.isChanged = true;
                    this._loading.resolve('vrp-problem-detail.load');

                    this.tableData = this.problem && this.problem[this.tableName];

                    this._dialog.alert('PROBLEM_DETAIL.FILE_IMPORT_COMPLETED_MSG');
                } else {
                    this._dialog.alert('PROBLEM_DETAIL.FILE_FORMAT_UNSUPPORT_ALERT');
                }
            } catch (err) {
                console.error(err);
                this._dialog.error('INVALID_FILE_FORMAT_ERR');
            }
        });
    }

    export(extension: string = 'json' || 'xlsx') {
        const fileName = `${this.problem.name || this.problem._id}.${extension}`;
        if (extension === 'json') {
            this._file.saveAsJson(this.problem, fileName);
        } else {
            this._excel.jsonToExcelFile(this.problem, this.tableColumns, fileName);
        }
    }

    geocode() {
        const primaryGeocodingService = this._authentication.primaryGeocodingService;
        console.log('geocode -> primaryGeocodingService', primaryGeocodingService);

        this._dialog.openDynamicEdit([
            { name: 'service', label: 'First Geocoding Service', type: 'select', selectionLabels: ['OneMap', 'Google Map', 'Baidu Map'], selections: ['onemap', 'gmap', 'bdmap'], default: primaryGeocodingService },
            { name: 'alternativeService', label: 'Second Geocoding Service', type: 'select', selectionLabels: ['OneMap', 'Google Map', 'Baidu Map'], selections: ['onemap', 'gmap', 'bdmap'], default: 'gmap' },
        ]).subscribe((answer) => {
            if (answer) {
                const msgSubject: Subject<string> = new Subject();
                const snackBar = this._dialog.openLoadingSnackBar(msgSubject);
                msgSubject.next('Geocoding ...');

                this._socket.onJSON('msg', (msg) => { // listen message from socket and show on waiting dialogs
                    if (msg.data && msg.data[0]) {
                        const msgStr = msg.data[0].replace(/['"]+/g, '');
                        console.log('geocode -> msgStr', msgStr);
                        msgSubject.next(msgStr);
                    }
                });

                const optObserver = this._problemRest.geocode(this.problem._id, answer.service, answer.alternativeService).pipe(
                    finalize(() => {
                        snackBar.dismiss();
                        this._socket.removeListener('msg');
                    }),
                ).subscribe((sol) => {
                    this._dialog.alert('PROBLEM_DETAIL.GEOCODING_COMPLETED_MSG').subscribe(() => this.load(true));
                }, (err) => this._dialog.closeAll().errorResponse(err));

                snackBar.onAction().subscribe(() => {// if user click cancel
                    optObserver.unsubscribe();
                    this._dialog.alert('PROBLEM_DETAIL.GEOCODING_CANCELLED_ALERT');
                });
            }
        });
    }

    queryDistanceMatrix() {
        this._loading.register('vrp-problem-detail.load');
        this._problemRest.queryDistanceMatrix(this.problem._id)
            .pipe(finalize(() => this._loading.resolve('vrp-problem-detail.load')))
            .subscribe(
                (res) => this._file.saveAsCSV(res, `${this.problem.name}-matrix.csv`),
                (err) => this._dialog.alert('PROBLEM_DETAIL.DISTANCE_QUERY_FAILED_ALERT'),
            );
    }

    editItem(item: any = undefined): void {
        const action = item ? 'Edit' : 'Create';
        console.debug(' editItem', action, this.tableName, item);
        const tableColumns = this.tableColumns[this.tableName];
        const config = tableColumns.map((i) => {
            if (i.source_data_id) {
                i.selections = this.problem[i.source_data_id].map((r) => r.id);
            }
            return i;
        });

        this._dialog.openDynamicEdit(config, item, `${action} ${this.tableName}`).subscribe((newValue) => {
            if (newValue) {
                this.isChanged = true;
                if (item) {
                    Object.assign(item, newValue);
                } else {
                    this.problem[this.tableName].push(newValue);
                }
                this.vrpTable.refresh();
            }
        });
    }

    createBlankSolution(): void {
        const defaultId = 's_ ' + this._datePipe.transform(new Date(), 'y_MM_dd_HHMMSS');
        this._dialog.prompt(defaultId, 'Solution name').subscribe((id) => {
            const newSolution = { id: id, routes: [] };
            if (!this.problem.solutions) {
                this.problem.solutions = [];
            }
            this.problem.solutions.unshift(newSolution);
            this._router.navigate(['solution', this.problem.solutions.length - 1], { relativeTo: this._route });
        });
    }

    reoptimizeSolutionWithTurnOverTime(initialSol: any) {
        this._dialog.openDynamicEdit([{ name: 'turnOverTime', label: 'Duration (min)', type: 'number', min: 5, max: 60, default: 30 }], undefined, 'Set Turn-over Duration between two trips').subscribe((newValues) => {
            if (newValues && !isNaN(newValues.turnOverTime)) {
                this.createOptimalSolution(initialSol, newValues.turnOverTime);
            }
        });
    }

    createOptimalSolution(initialSol: any = undefined, turnOverTime: number = undefined) {
        console.debug('createOptimalSolution', initialSol);
        const selectableOrders = [...this.problem.shipments, ...this.problem.services].map((order) => ({
            id: order.id, name: order.name, type: order.type ? order.type.toUpperCase() : 'SHIPMENT', priority: order.priority,
        }));

        this.vrpSolution.optimizeWithDialog(selectableOrders, this.problem.vehicles, initialSol, turnOverTime);
    }

    onOptimizationEnd(solution) {
        if (solution) {
            // this.isChanged = true;
            // this.save();
            this._dialog.confirm('PROBLEM_DETAIL.OPTIMIZATION_SOLUTION_VIEW_QUERY_MSG').subscribe((yes) => {
                if (yes) {
                    this._router.navigate([], { queryParamsHandling: 'merge', queryParams: { viewMode: 'solution', solutionIndex: this.problem.solutions.length - 1 }, relativeTo: this._route });
                }
            });
        } else {
            this._dialog.error('OPTIMIZATION_ERROR_ALERT');
        }
    }
}
