import { Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { ITdDataTableColumn, ITdDataTableSortChangeEvent, TdDataTableSortingOrder, TdDataTableService } from '@covalent/core/data-table';

@Component({
    selector: 'vrp-selection-dialog',
    templateUrl: './selection-dialog.component.html',
    styleUrls: ['./selection-dialog.component.scss'],
})
export class SelectionDialogComponent {

    title: string;
    elements: any;

    columns: any[] = [];
    data: any[] = [];

    sortBy: string;

    _dataTableService = new TdDataTableService();

    filteredData: any[];
    filteredTotal: number;

    searchTerm: string = '';
    fromRow: number = 1;

    selectedRows: any[] = [];

    rowClickCallback: any;

    sortOrder: TdDataTableSortingOrder = TdDataTableSortingOrder.Descending;

    @ViewChild('dataTable') dataTable;

    constructor(
        @Inject(MAT_DIALOG_DATA) private e: any,
    ) {
        this.title = this.e.title;
        this.columns = this.e.columns;
        this.data = this.e.data;
        this.rowClickCallback = this.e.rowClick;
        this.sortBy = this.e.columns[0].name;
        this.filter();
    }

    sort(sortEvent: ITdDataTableSortChangeEvent): void {
        this.sortBy = sortEvent.name;
        this.sortOrder = sortEvent.order;
        this.filter();
    }

    search(searchTerm: string): void {
        this.searchTerm = searchTerm;
        this.filter();
    }

    filter(): void {
        if (!this.data) {
            return;
        }

        let newData: any[] = this.data;
        const excludedColumns: string[] = this.columns
            .filter((column: ITdDataTableColumn) => {
                return ((column.filter === undefined && column.hidden === true) ||
                    (column.filter !== undefined && column.filter === false));
            }).map((column: ITdDataTableColumn) => {
                return column.name;
            });
        newData = this._dataTableService.filterData(newData, this.searchTerm, true, excludedColumns);
        this.filteredTotal = newData.length;
        newData = this._dataTableService.sortData(newData, this.sortBy, this.sortOrder);

        this.filteredData = newData;
    }

    rowClick(row) {
        if (this.rowClickCallback) {
            this.rowClickCallback(row);
        }
    }
}
