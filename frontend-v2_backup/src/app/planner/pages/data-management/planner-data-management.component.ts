import { Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VrpTableComponent } from '@components/vrp-table';
import { TdLoadingService } from '@covalent/core/loading';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { VrpExcelService, VrpFileService, VrpUserRestService } from '@app/vrp-common';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { SQL_TABLE_CONFIG } from '@app/planner/planner.config';
import { PlannerJobQuery } from '@app/planner/classes/planner-job-query';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerRestService, SqlTableNames } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-planner-data-management',
    templateUrl: './planner-data-management.component.html',
    styleUrls: ['./planner-data-management.component.scss'],
})
export class PlannerDataManagementComponent implements OnInit, OnDestroy {
    private _unassignedDriverUsers: any[];
    private _allDriverUsers: any[];

    private _firstLoad: boolean = true;

    private _subscriptions: Subscription[] = [];
    @ViewChild('vrpTable') private _vrpTable: VrpTableComponent;

    jobQuery: PlannerJobQuery;

    toolbarDropdownMenu: any[] = [
        { label: 'Download Excel Template', icon: 'description', click: () => { this.downloadExcelTemplate(); } },
        // { label: 'Import from Excel', icon: 'file_upload', click: () =>{ this.importFromExcel() },
        // { label: 'Export to Excel', icon: 'file_download', click: () => { this.exportToExcel(); } },
    ];

    innerHeight: number = 800;

    tableId: string;
    tableData: any = {};
    tableHeight: number = 500;
    tableName: SqlTableNames = 'Vehicle';
    tableList: any[] = [
        { name: 'DeliveryDetail', label: 'Order' },
        { name: 'Vehicle' },
        { name: 'VehicleType', label: 'Vehicle Type' },
        { name: 'Item' },
    ];

    tableItemActions: any[] = [
        { tooltip: 'Open', icon: 'launch', click: (item) => this.updateItem(item) },
    ];

    tableActions: any[] = [
        { tooltip: 'Add New Record', icon: 'add', click: () => this.updateItem() },
        { tooltip: 'Import from Excel', icon: 'file_upload', click: () => this.importFromExcel() },
        { tooltip: 'Export as Excel', icon: 'file_download', click: () => this.exportToExcel() },
    ];

    tableSelectActions: any[] = [
        { tooltip: 'Delete', icon: 'delete', click: (items) => this.deleteItems(items) },
    ];

    readonly columns: any = SQL_TABLE_CONFIG;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _plannerRest: PlannerRestService,
        private _userRest: VrpUserRestService,
        private _authentication: VrpAuthenticationService,
        private _loading: TdLoadingService,
        private _dialog: PlannerDialogService,
        private _excel: VrpExcelService,
        private _file: VrpFileService,
        private _plannerData: PlannerDataService,
        private _toast: VrpToastService,
    ) {
        this._plannerData.addListeners(['DeliveryMaster', 'DeliveryDetail', 'VehicleType', 'Vehicle', 'Item']);
        const today: Date = new Date();
        this.jobQuery = new PlannerJobQuery({ startDate: new Date(today), endDate: new Date(today), finishedJob: false });
        const isPowerPlanner: boolean = this._authentication.isPowerPlanner();
        if (!isPowerPlanner) {
            this.tableList = this.tableList.filter((e) => e.label === 'Order');
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.innerHeight = window.innerHeight - 65;
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit() {
        this.onResize();
        this._subscriptions = [];

        this._route.queryParams.subscribe((p) => {
            if (p.tableName && p.tableName !== this.tableName) {
                this.tableName = p.tableName;
                if (p.tableName !== 'Postal') {
                    if (p.tableName === 'DeliveryDetail') {
                        this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);
                    } else {
                        this._plannerData.get(this.tableName).getData$();
                    }
                }
            } else if (this._firstLoad) {
                this._plannerData.get(this.tableName).getData$();
            }
            this._firstLoad = false;
        });

        // this._subscriptions.push(
        // 	this._plannerData.DeliveryMaster.update$.subscribe((msg) => {
        // 		if (this.tableName === 'DeliveryDetail') {
        // 			console.log(`DeliveryMaster:update`, msg);
        // 			this._vrpTable.filter();
        // 			this._vrpTable.refresh();
        // 		}
        // 	}),
        // );

        ['DeliveryDetail', 'VehicleType', 'Vehicle', 'Item'].forEach((t: SqlTableNames) => {
            const cachedObject = this._plannerData.get(t);
            this._subscriptions.push(
                cachedObject.data$.subscribe((items) => { // subcribe to listen to data
                    if (this.tableName === t) {
                        console.log(`PlannerDataManagementComponent -> ngOnInit -> ${t}:get`, items);
                        this.tableData[this.tableName] = items;
                    }
                }, ((err) => {
                    this.tableData[this.tableName] = [];
                    this._dialog.errorResponse(err);
                })),
                cachedObject.update$.subscribe((msg) => {
                    if (this.tableName === t) {
                        console.log(`PlannerDataManagementComponent -> ngOnInit -> ${t}:update`, t, msg);
                        this._vrpTable.filter();
                        this._vrpTable.refresh();
                    }
                }),
            );
        });

    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    refresh() {
        this._dialog.confirm('REFRESH_CHANGES_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._plannerData[this.tableName].refresh();
                this._vrpTable.cancelSelection();
                this._vrpTable.clearSearchField();
                this._vrpTable.refresh();
            }
        });
    }

    async updateItem(item = undefined) {
        const isCreateNew: boolean = (item === undefined);
        const isPowerPlanner: boolean = this._authentication.isPowerPlanner();
        switch (this.tableName) {
            case 'DeliveryDetail':
                this._dialog.openOrderDetailById(isCreateNew ? undefined : item.DeliveryMasterId, false);
                break;
            case 'Vehicle':
                await this._updateUnassignedDriverUsernames(item);
                console.log('PlannerDataManagementComponent -> asyncupdateItem -> this._unassignedDriverUsers', this._unassignedDriverUsers);
                this._dialog.openVehicleDetail(item, this._unassignedDriverUsers, isPowerPlanner);
                break;
            case 'VehicleType':
                const vehicleTypeNames = this.tableData.VehicleType.map((i) => i.Name);
                this._dialog.openVehicleTypeDetail(item, vehicleTypeNames);
                break;
            case 'Item':
                const itemIds = this.tableData.Item.map((i) => i.Id);
                this._dialog.openItemDetail(item, itemIds);
                break;
        }
    }

    exportToExcel() {
        const fileName: string = `data_${this.tableName}.xlsx`;

        if (this.tableName === 'DeliveryDetail') {
            const deliveryItems: any = [];
            const Ids: any = [];
            this._vrpTable.filteredData.forEach((dd) => {
                if (!Ids.includes(dd.DeliveryMasterId)) {
                    Ids.push(dd.DeliveryMasterId);
                    dd.DeliveryItems.forEach((di) => {
                        di.DeliveryMasterId = dd.DeliveryMasterId;
                        deliveryItems.push(di);
                    });
                }
            });

            const data: any = { DeliveryDetail: this._vrpTable.filteredData, DeliveryItems: deliveryItems };
            const mappingConfig: any = { DeliveryDetail: this.columns[this.tableName], DeliveryItems: this.columns['DeliveryItem'] };
            this._excel.jsonToExcelFile(data, mappingConfig, fileName);
        } else {
            this._excel.jsonToSingleSheetExcelFile(this._vrpTable.filteredData, this.columns[this.tableName], this.tableName, fileName);
        }
    }

    importFromExcel() {
        if (this._authentication.isRestrictedPlanner()) {
            this._dialog.alert(`Restricted planners are not allowed to import data`);
        } else {
            this._dialog.openFileDialog({ accept: '.xlsx,.xls', type: 'binary' }, (result) => {
                const excelData = this._excel.workbookToJson(result, Object.assign({ DeliveryItem: [{ name: 'OrderId' }, { name: 'ItemId' }, { name: 'Quantity' }] }, this.columns));
                this._plannerData.importedExcel = excelData;
                this._router.navigate(['planner', 'data-import'], { queryParams: { canGoBack: true, backUrl: this._router.url } });
            });
        }
    }

    deleteItems(items) {
        let tName: SqlTableNames = this.tableName;

        this._dialog.confirm(`Are you sure to delete ${items.length} selected item(s)?`).subscribe((yes) => {
            if (yes) {
                let ids = items.map((i) => i.Id);
                if (tName === 'DeliveryDetail') {
                    tName = 'DeliveryMaster';
                    ids = items.map((i) => i.DeliveryMasterId);
                    console.log('deleteItems -> ids', ids, tName);
                }

                this._loading.register('planner-data-management.load');
                this._plannerRest.deleteMany(ids, tName).pipe(
                    finalize(() => this._loading.resolve('planner-data-management.load')),
                ).subscribe((res) => console.log('deleteItems', res),
                    (err) => this._toast.shortAlert('Delete Error', err));
            }
        });
    }

    onDateRangeChange(range) {
        this._vrpTable.selectedRows = [];
        this._plannerData.setDeliveryDetailCachedObject(this.jobQuery);
    }

    downloadExcelTemplate() {
        this._plannerRest.getExcelTemplate().subscribe((res) => this._file.saveBlobAs(res, `data_template.xlsx`), (err) => this._dialog.errorResponse(err));
    }

    private async  _updateUnassignedDriverUsernames(vehicleTobeIncluded: any = undefined) {
        const assignedDriverUsers = this.tableData.Vehicle.filter((v) => v.DriverUsername).map((v) => v.DriverUsername.toUpperCase());

        if (!this._allDriverUsers) {
            try {
                this._allDriverUsers = await this._userRest.getAllDriverUsers().toPromise();
                this._allDriverUsers.forEach((u) => u.username = u.username.toUpperCase());
            } catch (err) {
                this._dialog.errorResponse(err);
            }
        }

        // console.log('privateasync_updateUnassignedDriverUsernames -> this._allDriverUsers', this._allDriverUsers);
        this._unassignedDriverUsers = this._allDriverUsers.filter((d) => {
            const username: string = d.username;
            if (vehicleTobeIncluded && vehicleTobeIncluded.DriverUsername && (username === vehicleTobeIncluded.DriverUsername.toUpperCase())) {
                return true;
            } else {
                return !assignedDriverUsers.includes(username);
            }
        });
    }
}
