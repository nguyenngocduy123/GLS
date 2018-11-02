import { ValidatorUtils } from './validator-utils';
import { VehicleTypeValidator } from './vehicle-type-validator';

export class VehicleValidator {

    private _vehicleIds: string[] = [];
    private _assignedDriverUsernames: string[];
    private _allDriverUsernames: string[];

    constructor(
        vehicles: any[],
        driverUsers: any[],
        private _usergroupNames: any[],
        private _vehicleTypeValidator: VehicleTypeValidator,
    ) {
        console.log('VehicleValidator -> constructor -> _usergroups', _usergroupNames);
        if (vehicles) {
            this._vehicleIds = vehicles.map((v) => v.Id);
        }

        if (driverUsers) {
            this._assignedDriverUsernames = vehicles.filter((v) => v.DriverUsername).map((v) => v.DriverUsername.toUpperCase());
            console.log('this._assignedDriverUsernames', this._assignedDriverUsernames);
            this._allDriverUsernames = driverUsers.map((u) => u.username.toUpperCase());
            console.log('this._allDriverUsernames', this._allDriverUsernames);
        }
    }

    validate(data: any[]) {
        const previous = [];
        data.forEach((r) => {
            if (ValidatorUtils.checkAlphaNumeric(r, 'Id')) {
                if (previous.includes(r.Id)) {
                    ValidatorUtils.setDuplicateError(r, 'Id');
                } else if (this._vehicleIds.includes(r.Id)) {
                    ValidatorUtils.setAlreadyExistError(r, 'Id');
                } else {
                    previous.push(r.Id);
                }
            }

            if (r.DriverUsername) {
                if (this._assignedDriverUsernames.includes(r.DriverUsername.toUpperCase())) {
                    ValidatorUtils.setError(r, 'DriverUsername', `Already assigned to other vehicles`);
                } else if (!this._allDriverUsernames.includes(r.DriverUsername.toUpperCase())) {
                    ValidatorUtils.setInExistError(r, 'DriverUsername');
                }
            }

            if (!r.VehicleType || !this._vehicleTypeValidator.isVehicleTypeExist(r.VehicleType.Name)) {
                ValidatorUtils.setInExistError(r, 'VehicleType');
            }

            if (r.UserGroup) {
                if (!this.isUserGroupExist(r.UserGroup)) {
                    ValidatorUtils.setInExistError(r, 'UserGroup');
                }
            }

            const isStartTimeValid: boolean = ValidatorUtils.checkTimeFormat(r, 'StartTime');
            const isEndTimeValid: boolean = ValidatorUtils.checkTimeFormat(r, 'EndTime');

            if (isStartTimeValid && isEndTimeValid) {
                if (r.StartTime > r.EndTime) {
                    ValidatorUtils.setError(r, 'Time', `StartTime must be earlier than EndTime`);
                }
            }

            ValidatorUtils.checkNonNegativeNumber(r, 'MaxNumJobs');

            ['StartAddressPostal', 'EndAddressPostal'].forEach((prop) => ValidatorUtils.checkPostalCode(r, prop));

            if (r.PlateNumber) {
                ValidatorUtils.checkPlateNumber(r, 'PlateNumber');
            }

            if (ValidatorUtils.isRowValid(r)) {// update valid itemIds
                this._vehicleIds.push(r.Id);
            }
        });
    }

    isVehicleIdExist(vehicleId: string): boolean {
        return vehicleId && this._vehicleIds.includes(vehicleId);
    }

    isUserGroupExist(usergroup: string): boolean {
        return this._usergroupNames.includes(usergroup.toUpperCase());
    }
}
