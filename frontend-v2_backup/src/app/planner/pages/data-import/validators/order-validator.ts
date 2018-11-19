import { ValidatorUtils } from './validator-utils';
import { startsWith as _startsWith } from 'lodash-es';
import * as isEqual from 'date-fns/is_equal';
import * as isAfter from 'date-fns/is_after';
import * as isSameDay from 'date-fns/is_same_day';

import { VehicleValidator } from './vehicle-validator';
import { VehicleTypeValidator } from './vehicle-type-validator';
import { PlannerRestService, DuplicatesTableNames } from '@app/planner/services/planner-rest.service';

export class OrderValidator {

    private _orderIds: string[] = [];
    private _orderData: any[] = [];
    private _tableName: DuplicatesTableNames = 'order';

    constructor(
        private _vehicleValidator: VehicleValidator,
        private _vehicleTypeValidator: VehicleTypeValidator,
        private _plannerRest: PlannerRestService,
    ) { }

    validate(data: any[]) {
        this._orderIds = [];
        this._orderData = data;
        const previous = [];
        let prevRow;
        this._validateExistingId(data);

        const pickupOrders = data.filter((o) => o.JobType && o.JobType.toUpperCase() === 'PICKUP');
        data.forEach((r) => {
            if (r.Id && r.Id.trim() !== '') {
                if (previous.includes(r.Id)) {
                    ValidatorUtils.setDuplicateError(r, 'Id');
                } else {
                    previous.push(r.Id);
                }
            } else if (prevRow) {// if OrderId leave blank, read from previous record
                ['Id', 'VehicleRestriction', 'CustomerName', 'Priority', 'CustomerEmail', 'CustomerPhone', 'UserGroup'].forEach((k) => r[k] = prevRow[k]);
                if (prevRow._error) {
                    prevRow._error.filter((e) => e[0] === 'Id').forEach((e) => ValidatorUtils.setError(r, 'Id', e[1]));
                }

            }

            if (r.JobType && r.JobType.toUpperCase() === 'DELIVERY') {
                const pickupOrder = pickupOrders.find((d) => d.Id === r.Id);
                if (pickupOrder && (isAfter(pickupOrder.StartTimeWindow, r.EndTimeWindow) || isEqual(pickupOrder.StartTimeWindow, r.EndTimeWindow))) {
                    ValidatorUtils.setError(r, 'TimeWindow', 'Delivery TimeWindow is earlier than Pickup TimeWindow');
                }
            }

            ValidatorUtils.checkAlphaNumeric(r, 'Id');
            ValidatorUtils.checkJobType(r, 'JobType');
            ValidatorUtils.checkPriority(r, 'Priority');
            if (r.VerificationCode) {
                ValidatorUtils.checkVerificationCode(r, 'VerificationCode');
            }

            [`ServiceTime`].forEach((prop) => ValidatorUtils.checkNonNegativeNumber(r, prop));

            [`CustomerPhone`, 'ContactPhone'].forEach((prop) => {
                if (r[prop]) {
                    ValidatorUtils.checkPhoneNumber(r, prop);
                }
            });

            const start = r.StartTimeWindow;
            const end = r.EndTimeWindow;

            if (!start || !end) {
                if (!start) {
                    ValidatorUtils.setIncorrectDateError(r, 'StartTimeWindow');
                }

                if (!end) {
                    ValidatorUtils.setIncorrectDateError(r, 'EndTimeWindow');
                }
            } else {
                if (isAfter(start, end)) {
                    ValidatorUtils.setError(r, 'EndTimeWindow', 'EndTimeWindow is earlier than StartTimeWindow');
                }

                if (!isSameDay(start, end)) {
                    ValidatorUtils.setError(r, 'EndTimeWindow', 'EndTimeWindow is not same date as StartTimeWindow');
                }

                if (start.isPastDay()) {
                    ValidatorUtils.setError(r, 'StartTimeWindow', 'Past Dates are not allowed');
                }
            }

            ValidatorUtils.checkPostalCode(r, 'Postal');

            if (r.UserGroup) {
                if (!this._vehicleValidator.isUserGroupExist(r.UserGroup)) {
                    ValidatorUtils.setInExistError(r, 'UserGroup');
                }
            }

            this._checkVehicleRestriction(r, 'VehicleRestriction');
            if (ValidatorUtils.isRowValid(r)) {// update valid itemIds
                this._orderIds.push(r.Id);
            }

            prevRow = r;
        });
    }

    isOrderIdExist(orderId: string): boolean {
        return this._orderIds.includes(orderId);
    }

    getOrderIds(): string[] {
        return this._orderIds;
    }

    getOrderDetails(orderId: string): any {
        return this._orderData.find((d) => d.Id === orderId);
    }

    private _checkVehicleRestriction(r: any, prop: string) {
        if (!r[prop]) {
            return;
        }

        const restrictionStr: string = r[prop];

        const prefix = ['', '@', '#', '#@'];
        const values: string[] = restrictionStr.split(',');
        const errorVehicleNames: string[] = [];
        const errorVehicleIds: string[] = [];

        values.forEach((e: string) => {
            for (let i = prefix.length; i >= 0; i--) {
                if (_startsWith(e, prefix[i])) {
                    const value = e.replace(prefix[i], '');
                    if (prefix[i].includes('@')) {
                        if (!this._vehicleTypeValidator.isVehicleTypeExist(value)) {
                            errorVehicleNames.push(value);
                        }
                    } else if (!this._vehicleValidator.isVehicleIdExist(value)) {
                        errorVehicleIds.push(value);
                    }
                    break;
                }
            }
        });

        if (errorVehicleIds.length > 0) {
            ValidatorUtils.setError(r, 'VehicleRestriction', `${errorVehicleIds.join(', ')} invalid`);
        }
        if (errorVehicleNames.length > 0) {
            ValidatorUtils.setError(r, 'VehicleRestriction-Types', `${errorVehicleNames.join(', ')} invalid`);
        }
    }

    private async _validateExistingId(data: any[]) {
        const orderIds: string[] = data.map((r) => r.Id);
        await this._plannerRest.checkForDuplicates(orderIds, this._tableName).subscribe((duplicates) => {
            duplicates.map((id) => ValidatorUtils.setAlreadyExistError(data[orderIds.indexOf(id)], 'OrderId'));
        });

    }
}
