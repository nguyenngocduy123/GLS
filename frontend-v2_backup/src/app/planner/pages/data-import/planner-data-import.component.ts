import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { TdLoadingService } from '@covalent/core/loading';
import { forkJoin } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { remove as _remove } from 'lodash-es';

import { VrpTableComponent } from '@components/vrp-table';
import { PlannerUtils } from '@app/planner/classes/planner-utils';
import { VrpExcelService, VrpUserRestService, VrpUserGroupRestService, VrpGeocodeService } from '@app/vrp-common';
import { SQL_TABLE_CONFIG } from '@app/planner/planner.config';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { PlannerRestService, SqlTableNames } from '@app/planner/services/planner-rest.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { DeliveryItemValidator } from './validators/delivery-item-validator';
import { ItemValidator } from './validators/item-validator';
import { OrderValidator } from './validators/order-validator';
import { ValidatorUtils } from './validators/validator-utils';
import { VehicleTypeValidator } from './validators/vehicle-type-validator';
import { VehicleValidator } from './validators/vehicle-validator';

const TABLE_LIST: any[] = [
    { name: 'Item', label: 'Item', icon: 'dns' },
    { name: 'VehicleType', label: 'Vehicle Type', icon: 'local_shipping' },
    { name: 'Vehicle', label: 'Vehicle', icon: 'local_shipping' },
    { name: 'Order', label: 'Order', icon: 'call_made' },
    { name: 'DeliveryItem', label: 'Delivery Item', icon: 'dns' },
];

@Component({
    selector: 'vrp-planner-data-import',
    templateUrl: './planner-data-import.component.html',
    styleUrls: ['./planner-data-import.component.scss'],
})
export class PlannerDataImportComponent implements OnInit {

    private _itemValidator: ItemValidator;
    private _vehicleValidator: VehicleValidator;
    private _vehicleTypeValidator: VehicleTypeValidator;
    private _deliveryItemValidator: DeliveryItemValidator;
    private _orderValidator: OrderValidator;

    @ViewChild('vrpTable') vrpTable: VrpTableComponent;

    backUrl: string;

    nInvalidData: number = 0;

    selectedIndex: number = 0;
    tableName: string;
    tableList: any[] = [] = TABLE_LIST;

    tableHeight: number = 5;
    data: any = { errorMsg: [] };
    columns: any = {};

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _loading: TdLoadingService,
        private _plannerData: PlannerDataService,
        private _plannerRest: PlannerRestService,
        private _userRest: VrpUserRestService,
        private _userGroupRest: VrpUserGroupRestService,
        private _geocode: VrpGeocodeService,
        private _dialog: PlannerDialogService,
        private _excel: VrpExcelService,
        private _toast: VrpToastService,
    ) {
        this._route.queryParams.subscribe((p) => {
            if (p.tableName && p.tableName !== this.tableName) {
                if (this.data && this.data[p.tableName]) {
                    this.tableName = p.tableName;
                }
            }

            if (p.backUrl) {
                this.backUrl = p.backUrl;
            }
        });
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit() {
        this.onResize();
        this.load();
    }

    load() {
        this.tableList = TABLE_LIST.filter((t) => this._plannerData.importedExcel[t.name]);
        console.log('PlannerDataImportComponent -> load -> this._plannerData.importedExcel', this._plannerData.importedExcel);

        this._loading.register('planner-data-import.load');
        forkJoin([
            this._plannerRest.getItems(),
            this._plannerRest.getVehicles(),
            this._plannerRest.getVehicleTypes(),
            this._userRest.getAllDriverUsers(),
            this._userGroupRest.getAllUserGroups(),
        ]).pipe(
            catchError((err) => this._dialog.errorResponse(err)),
            finalize(() => this._loading.resolve('planner-data-import.load')),
        ).subscribe(([items, vehicles, vehicleTypes, driverUsers, usergroups]) => {
            this._itemValidator = new ItemValidator(items);
            this._vehicleTypeValidator = new VehicleTypeValidator(vehicleTypes);
            this._vehicleValidator = new VehicleValidator(vehicles, driverUsers, usergroups.map((u) => u.usergroup), this._vehicleTypeValidator, this._plannerRest);
            this._orderValidator = new OrderValidator(this._vehicleValidator, this._vehicleTypeValidator, this._plannerRest);
            this._deliveryItemValidator = new DeliveryItemValidator(this._itemValidator, this._orderValidator);

            this.validateAllTables();
            this.checkDataValid();

            if (this.vrpTable) {
                this.vrpTable.filter();
            }
        });
    }

    checkDataValid() {
        this._route.queryParams.subscribe((params: Params) => {
            const currentTable: string = params.tableName;
            let errorCount: number = 0;
            Object
                .keys(this.data)
                .forEach((tableName: string) => {
                    errorCount += this.data[tableName].filter((r) => !ValidatorUtils.isRowValid(r)).length;
                });
            this.nInvalidData = errorCount;
        });
    }

    async save() {
        console.log('PlannerDataImportComponent -> asyncsave -> this.data', this.data);
        try {
            this._loading.register('planner-data-import.load');
            if (this.data.VehicleType && this.data.VehicleType.length > 0) { // save vehicle types if any
                await this._insertCreateRequest(this.data.VehicleType, 'VehicleType');
            }

            if (this.data.Vehicle && this.data.Vehicle.length > 0) { // save vehicle if any
                const vehicleTypes: any[] = await this._plannerRest.getVehicleTypes(true).toPromise();
                const vehiclesToBeInserted: any[] = this.data.Vehicle.filter((v) => {
                    const vType = vehicleTypes.find((t) => t.Name.toUpperCase() === v.VehicleType.Name.toUpperCase());
                    if (vType) {
                        v.VehicleTypeId = vType.Id;
                        return true;
                    }
                    return false;
                });

                console.log('PlannerDataImportComponent -> asyncsave -> vehiclesToBeInserted', vehiclesToBeInserted);
                await this._insertCreateRequest(vehiclesToBeInserted, 'Vehicle');
            }

            if (this.data.Item && this.data.Item.length > 0) { // save items
                await this._insertCreateRequest(this.data.Item, 'Item');
            }

            if (this.data.Order && this.data.Order.length > 0) { // save orders
                const validOrders: any[] = [];
                this.data.Order.forEach((r) => {
                    let order = validOrders.find((o) => o.Id === r.Id);
                    if (!order) {// create if does not exist
                        order = { DeliveryDetails: [] };
                        ['Id', 'VehicleRestriction', 'CustomerName', 'Priority', 'CustomerEmail', 'CustomerPhone', 'UserGroup'].forEach((k) => order[k] = r[k]);
                        validOrders.push(order);
                    }
                    const sequence: number = order.DeliveryDetails.length + 1;

                    const items = this.data.DeliveryItem.filter((i) => i.DeliveryMasterId === r.Id);
                    const detail: any = {
                        JobSequence: sequence,
                        JobType: r.JobType, Address: r.Address,
                        Postal: r.Postal, Lat: r.Lat, Lng: r.Lng,
                        StartTimeWindow: r.StartTimeWindow,
                        EndTimeWindow: r.EndTimeWindow,
                        ServiceTime: r.ServiceTime,
                        ContactName: r.ContactName || r.CustomerName,
                        ContactPhone: r.ContactPhone || r.CustomerPhone,
                        ContactEmail: r.ContactEmail || r.CustomerEmail,
                        DeliveryItems: items,
                        NoteFromPlanner: r.Note && [{ key: 'Note', value: r.Note }],
                    };

                    if (r.VerificationCode && r.VerificationCode !== '') {
                        detail.VerificationCode = { Code: r.VerificationCode };
                    }

                    order.DeliveryDetails.push(detail);
                });
                console.log('PlannerDataImportComponent -> asyncsave -> validOrders', validOrders);
                await this._insertCreateRequest(validOrders, 'DeliveryMaster');
            }

            this._dialog.alert('PLANNER_DATA_IMPORT.DATA_SAVED_SUCCESS_MSG').subscribe(() => { // alert data has been saved and
                if (this.backUrl) { // redirect to previous url
                    this.close();
                } else { // if not, blank everything
                    this.data = { errorMsg: [] }; // clear data after importing
                    this.columns = {};
                    this.tableName = undefined;
                    this._plannerData.importedExcel = {};
                }
            });
        } catch (err) {
            this._toast.shortAlert('Failed to save data to server', err);
        } finally {
            this._loading.resolve('planner-data-import.load');
        }
    }

    close() {
        this._router.navigateByUrl(this.backUrl);
    }

    importFromExcel() {
        this._dialog.openFileDialog({ accept: '.xlsx,.xls', type: 'binary' }, (res) => {
            if (res) {
                this._plannerData.importedExcel = this._excel.workbookToJson(res, SQL_TABLE_CONFIG);
                this.load();
            }
        });
    }

    removeInvalidRecords() {
        let nErrors: number = 0;
        Object.keys(this.data).forEach((tableName: string) => {
            _remove(this.data[tableName], (r) => {
                const isValid: boolean = ValidatorUtils.isRowValid(r);

                if (!isValid) {
                    nErrors++;
                    // nErrors += this._removeDependantRecordsWhenRecordRemoved(r, tableName); //disable for debugging purpose
                }

                return !isValid;
            });
        });

        this._toast.shortAlert(`Removed ${nErrors} invalid record(s)`);
        this.checkDataValid();
        this.vrpTable.refresh();
    }

    validateAllTables() {
        const deliveryItems: any = this._plannerData.importedExcel['DeliveryItem'] || [];
        deliveryItems.forEach((d) => d._error = []);
        console.log('validateAllTables -> this._plannerData.importedExcel', this._plannerData.importedExcel);
        let first: boolean = true;
        this.tableList.forEach((table) => {
            const t: string = table.name;
            const tableColumn: any[] = SQL_TABLE_CONFIG[t].filter((c) => (t === 'VehicleType') ? c.name !== 'Id' : true);

            if (tableColumn) {
                tableColumn.unshift({ label: 'Error', name: '_error', width: 300 });
                this.columns[t] = tableColumn;
                const data = this._plannerData.importedExcel[t];
                data.forEach((d) => d._error = []);

                switch (t) {
                    case 'Order':
                        this._validateOrder(data, deliveryItems.map((d) => d.DeliveryMasterId)).then((v) => this._validateDeliveryItem(deliveryItems));
                        break;
                    case 'Vehicle':
                        this._validateVehicle(data);
                        break;
                    case 'VehicleType':
                        this._validateVehicleType(data);
                        break;
                    case 'Item':
                        this._validateItem(data);
                        break;
                }

                this.data[t] = data;
                if (first) {
                    first = false;
                    this.tableName = t;
                    this._router.navigate([], { queryParams: { tableName: t } });
                }
            }

        });
    }

    onRowsDeleted(deletedItems: any[]) {
        deletedItems.forEach((r) => this._removeDependantRecordsWhenRecordRemoved(r, this.tableName));
        this.checkDataValid();
    }

    private _removeDependantRecordsWhenRecordRemoved(r, tableName): number {
        let nErrors: number = 0;
        if (tableName === 'Order') {
            nErrors += _remove(this.data.DeliveryItem, (i) => i.DeliveryMasterId === r.Id).length;
        } else if (tableName === 'VehicleType') {
            nErrors += _remove(this.data.Vehicle, (i) => i.VehicleType.Name === r.Name).length;
        } else if (tableName === 'Item') {
            nErrors += _remove(this.data.DeliveryItem, (i) => i.ItemId === r.Id).length;
        }
        return nErrors;
    }

    private _validateDeliveryItem(data: any[]) {
        this._deliveryItemValidator.validate(data);
    }

    private _validateVehicle(data: any[]) {
        this._checkPostalCode(data, 'StartAddressPostal');
        this._checkPostalCode(data, 'EndAddressPostal');
        this._vehicleValidator.validate(data);
    }

    private _validateVehicleType(data: any[]) {
        this._vehicleTypeValidator.validate(data);
    }

    private _validateItem(data: any[]) {
        this._itemValidator.validate(data);
    }

    private async _validateOrder(data: any[], itemOrderIds: any[]) {
        await this._checkPostalCode(data, 'Postal');
        this._checkOrderItemExist(data, itemOrderIds);
        this._orderValidator.validate(data);
    }

    private _checkOrderItemExist(data: any[], itemOrderIds: any[]) {
        data.forEach((r) => {
            if (!itemOrderIds.includes(r.Id)) {
                ValidatorUtils.setError(r, 'Order', 'Delivery Items cannot be Empty');
            }
        });
    }

    private async _checkPostalCode(data: any[], prop: string) {
        const postals: string[] = data.map((r) => r[prop]).filter((r) => r);
        this._geocode.geocode(postals).subscribe((coords) => {
            // console.log('_validatePostalCode', coords, postals, prop);
            data.forEach((r) => {
                if (r[prop]) {
                    const coord = coords.find((e) => e.postal === r[prop]);
                    if (coord && PlannerUtils.isLatLngInSingapore(coord.lat, coord.lon)) {
                        if (prop === 'Postal') {
                            r.Lat = coord.lat;
                            r.Lng = coord.lon;
                        } else {
                            r[prop.replace('Postal', 'Lat')] = coord.lat;
                            r[prop.replace('Postal', 'Lng')] = coord.lon;
                        }
                    } else {
                        ValidatorUtils.setInExistError(r, prop);
                    }
                }
            });
            this.checkDataValid();
        }, (err) => data.forEach((r) => {
            if (r[prop]) {
                ValidatorUtils.setInExistError(r, prop);
            }
            this.checkDataValid();
        }));
    }

    private async _insertCreateRequest(data, tableName: SqlTableNames) {
        const insertObservables = this._plannerRest.create(data, tableName);
        await insertObservables.toPromise();
    }
}
