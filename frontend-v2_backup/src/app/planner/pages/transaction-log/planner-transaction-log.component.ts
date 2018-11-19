import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { VrpExcelService, VrpFileService, VrpUtils } from '@app/vrp-common';
import { VrpTableComponent } from '@components/vrp-table';
import { PlannerJobQuery } from '@app/planner/classes/planner-job-query';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { TRANSACTION_LOG_TABLE_CONFIG, STATUS_LABELS } from '@app/planner/planner.config';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-transaction-log',
    templateUrl: './planner-transaction-log.component.html',
    styleUrls: ['./planner-transaction-log.component.scss'],
})
export class PlannerTransactionLogComponent implements OnInit, OnDestroy {

    private _subscriptions: Subscription[] = [];

    @ViewChild('timeFilterMenu') private _timeFilterMenu;
    @ViewChild('vrpTable') private _vrpTable: VrpTableComponent;

    tableHeight: number = 5;
    data: any[];

    jobQuery: PlannerJobQuery;

    summaryText: string = '';
    downloadInProgress: boolean = false;

    tableItemActions: any[] = [
        { tooltip: 'Open', icon: 'launch', click: (item) => this._dialog.openOrderDetailById(item.DeliveryMasterId) },
    ];

    tableActions: any[] = [
        { label: 'Delivery Time Filter', menuTemplateRef: () => this._timeFilterMenu },
    ];

    readonly columns: any[] = TRANSACTION_LOG_TABLE_CONFIG;

    constructor(
        private _plannerRest: PlannerRestService,
        private _dialog: PlannerDialogService,
        private _plannerData: PlannerDataService,
        private _file: VrpFileService,
        private _excel: VrpExcelService,
    ) {
        this._plannerData.addListeners(['DeliveryDetail']);
        this.jobQuery = new PlannerJobQuery({ startDate: new Date(), endDate: new Date(), finishedJob: true });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit() {
        this.onResize();
        this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);

        const t = this._plannerData.DeliveryDetail;
        this._subscriptions = [
            t.data$.subscribe((res) => {
                console.debug('DeliveryDetail:get', res);
                this.data = res;
                this._updateSummaryText();
            }),

            t.update$.subscribe((res) => {
                console.debug('DeliveryDetail:update', res);
                this._vrpTable.filter();
                this._vrpTable.refresh();
            }),
        ];
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    refresh() {
        this._dialog.confirm('REFRESH_CHANGES_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._plannerData.DeliveryDetail.refresh();
                this._vrpTable.cancelSelection();
                this._vrpTable.clearSearchField();
                this._vrpTable.refresh();
            }
        });

    }

    applyDeliveryTimeFilter(timeRange: any) {
        const filteredData = VrpUtils.applyFilterToDateColumn(this.data, 'ActualDeliveryTime', timeRange);
        this._vrpTable.filter(filteredData);
        this.tableActions[0].label = `Filtered (${timeRange.start} to  ${timeRange.end}) `;
    }

    onDateRangeChange(range) {
        this._vrpTable.selectedRows = [];
        this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);
    }

    exportToExcel() {
        const fileName: string = `${this._getBaseFileName()}.xlsx`;
        this._excel.jsonToSingleSheetExcelFile(this._vrpTable.filteredData, this.columns, 'transaction-log', fileName);
    }

    exportToZip(withPhotos: boolean) {
        this.downloadInProgress = true;
        this._plannerRest.getTransactionLogFile(this.jobQuery.startDate, this.jobQuery.endDate, withPhotos)
            .pipe(finalize(() => this.downloadInProgress = false))
            .subscribe((blob) => {
                this._file.saveBlobAs(blob, `${this._getBaseFileName()}-${withPhotos ? 'withPhoto' : 'noPhoto'}.zip`);
            }, (err) => this._dialog.errorResponse(err));
    }

    private _getBaseFileName(): string {
        return `transaction-log-${this.jobQuery.startDate.YYMMDD()}-${this.jobQuery.endDate.YYMMDD()}`;
    }

    private _updateSummaryText() {
        const nCounts: number[] = STATUS_LABELS.map(() => 0);
        this.data.forEach((row) => nCounts[row.Status]++);
        let s: string = `  ${this.data.length} of job(s) finished, `;
        s += nCounts.map((c, status) => (c > 0) ? `${c} ${STATUS_LABELS[status]}` : undefined).filter((c) => c).join(', ');
        this.summaryText = s;
    }
}
