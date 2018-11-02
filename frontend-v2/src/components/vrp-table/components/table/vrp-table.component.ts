import { Component, EventEmitter, forwardRef, Input, OnChanges, Output, ViewChild, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ITdDataTableColumn, ITdDataTableSortChangeEvent, TdDataTableService, TdDataTableSortingOrder } from '@covalent/core/data-table';
import { remove as _remove, sortBy as _sortBy, isEqual as _isEqual, differenceWith as _differenceWith } from 'lodash-es';

import { VrpDialogService } from '@components/vrp-dialog';

const noOp = () => { };

@Component({
    selector: 'vrp-table',
    templateUrl: './vrp-table.component.html',
    styleUrls: ['./vrp-table.component.scss'],
    providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => VrpTableComponent), multi: true }],
})
export class VrpTableComponent implements OnChanges, ControlValueAccessor {

    private _customFilteredData: any[];

    // placeholders for the callbacks which are later provided by the Control Value Accessor
    private _onTouchedCallback: () => void = noOp;
    private _onChangeCallback: (_: any) => void = noOp;

    @Input() id: string;
    @Input() columns: any[] = [];
    @Input() data: any[] = [];
    @Input() requiredData: any[] = []; // list of data that cannot be un-selected
    @Input() tableActions: any[] = [];
    @Input() selectActions: any[] = [{ label: 'Delete', icon: 'delete', click: (items) => this.deleteItems(items) }];

    @Input() showSelectColumns: boolean = true;

    @Input() itemActions: any[] = [];
    @Input() itemMenu: any[] = [];

    @Input() sortBy: string;
    @Input() tableTitle: string = undefined;

    _dataTableService = new TdDataTableService();

    filteredData: any[];
    filteredTotal: number;
    searchTerm: string = '';

    selectedRows: any[] = [];

    sortOrder: TdDataTableSortingOrder = TdDataTableSortingOrder.Descending;

    @Input() sortable: boolean = true;
    @Input() clickable: boolean = true;
    @Input() selectable: boolean = true;
    @Input() multiple: boolean = true;
    @Input() editable: boolean = true;

    @Input() tableHeight: number = 500;

    @Output() editRow: EventEmitter<any> = new EventEmitter();
    @Output() deleteRow: EventEmitter<any> = new EventEmitter();

    @ViewChild('dataTable') dataTable;
    @ViewChild('searchBox') searchBox;

    @Input() set value(v: any) {
        this.selectedRows = v;
        this._onChangeCallback(v);
    }

    constructor(
        private _dialog: VrpDialogService,
    ) { }

    get value(): any { return this.selectedRows; }

    writeValue(value: any) { // required by ControlValueAccessor interface
        if (value !== this.selectedRows) {
            this.selectedRows = value;
        }
    }

    registerOnChange(fn: any) { // required by ControlValueAccessor interface
        this._onChangeCallback = fn;
    }

    registerOnTouched(fn: any) { // required by ControlValueAccessor interface
        this._onTouchedCallback = fn;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.columns && this.columns) {
            this._loadValuesToSessionStorage();
        }

        this.filter();
    }

    cancelSelection() {
        this.selectedRows = [];
        this._onChangeCallback(this.selectedRows);
        this._selectRequiredData();
    }

    filterColumns() {
        const formElements = this.columns.map((c, index) => ({ name: `c_${index}`, label: c.label, type: 'checkbox', default: !c.hidden }));

        this._dialog.openDynamicEdit(formElements, undefined, 'Select columns')
            .subscribe((answer) => {
                if (answer) {
                    this.columns.forEach((c, index) => {
                        c.hidden = !answer['c_' + index] && c.label !== '';
                    });
                    this._saveValuesToSessionStorage();
                    this.filter(this._customFilteredData);
                    this.refresh();
                }
            });
    }

    deleteItems(items) {
        _remove(this.data, (d) => items.indexOf(d) !== -1);
        this.deleteRow.emit(items);
        this.cancelSelection();
        this.filter(this._customFilteredData);
    }

    onSort(sortEvent: ITdDataTableSortChangeEvent): void {
        this.sortBy = sortEvent.name;
        this.sortOrder = sortEvent.order;
        this.filter(this._customFilteredData);
    }

    onSelectAny(): void {
        this._selectRequiredData();
    }

    search(searchTerm: string): void {
        this.searchTerm = searchTerm.trim();
        this.filter(this._customFilteredData);
    }

    clearSearchField() {
        this.searchBox.value = '';
    }

    filter(customFilteredData: any[] = undefined): void {
        this._customFilteredData = customFilteredData;

        if (!this.columns || !this.data) {
            return;
        }

        const excludedColumns: string[] = this.columns
            .filter((column: ITdDataTableColumn) => {
                return (((column.filter === undefined && column.hidden === true) ||
                    (column.filter !== undefined && column.filter === false)));
            }).map((column: ITdDataTableColumn) => column.name);

        let newData: any[] = this.data;
        if (newData.length > 0) {
            if (!this._customFilteredData) {
                newData = this._dataTableService.filterData(newData, this.searchTerm, true, excludedColumns);
            } else {
                newData = this._dataTableService.filterData(this._customFilteredData, this.searchTerm, true, excludedColumns);
            }
            if (this.sortBy) {
                newData = _sortBy(newData, this.sortBy);
                if (this.sortOrder === TdDataTableSortingOrder.Descending) {
                    newData.reverse();
                }
            }

            this.filteredTotal = newData.length;
        } else {
            this.filteredTotal = 0;
        }

        this.filteredData = newData;

        // select/unselect only the filtered data
        // this.selectedRows = this.selectedRows.filter((r) => this.filteredData.includes(r));

        this._selectRequiredData();

        this._onChangeCallback(this.selectedRows);
    }

    refresh() {
        this.dataTable.refresh();
    }

    private _selectRequiredData() {
        if (!this.requiredData || this.requiredData.length === 0) {
            return;
        }

        // add missing list of required data (i.e. cannot be unselected) back to selection list
        const missingRequiredData = _differenceWith(this.requiredData, this.selectedRows, _isEqual);
        this.selectedRows.push(...missingRequiredData);
    }

    private _loadValuesToSessionStorage() {
        if (this.id) {
            try {
                const defaultValues: boolean[] = JSON.parse(sessionStorage.getItem(this.id));
                if (defaultValues) {
                    this.columns.forEach((c, i) => { if (c.name !== '_itemActions') { c.hidden = defaultValues[i]; } });
                }
            } catch (err) {
                console.trace(`Can load Table ${this.id} from sessionStorage`);
            }
        }
    }

    private _saveValuesToSessionStorage() {
        if (this.id) {
            try {
                const defaultValues: boolean[] = this.columns.map((c) => c.hidden);
                sessionStorage.setItem(this.id, JSON.stringify(defaultValues));
            } catch (err) {
                console.trace(`Can save Table ${this.id} to sessionStorage`);
            }
        }
    }
}
