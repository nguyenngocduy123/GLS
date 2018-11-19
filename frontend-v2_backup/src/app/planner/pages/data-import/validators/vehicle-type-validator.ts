import { ValidatorUtils } from './validator-utils';

export class VehicleTypeValidator {
    private _vehicleTypeNames: string[];

    constructor(
        vehicleTypes,
    ) {
        if (vehicleTypes) {
            this._vehicleTypeNames = vehicleTypes.map((v) => v.Name.toUpperCase());
        }
    }

    validate(data: any[]) {
        const previous = [];
        data.forEach((r) => {
            if (ValidatorUtils.checkAlphaNumeric(r, 'Name')) { // validate Name
                if (previous.includes(r.Name)) {
                    ValidatorUtils.setDuplicateError(r, 'Name');
                } else if (this._vehicleTypeNames.includes(r.Name.toUpperCase())) {
                    ValidatorUtils.setAlreadyExistError(r, 'Name');
                } else {
                    previous.push(r.Name);
                }
            }

            if (ValidatorUtils.isRowValid(r)) {
                this._vehicleTypeNames.push(r.Name.toUpperCase());
            }

            [`Capacity`, `FixedCost`, `DistanceCost`, `TravelTimeCost`, `WaitingTimeCost`].forEach((key) => ValidatorUtils.checkNonNegativeNumber(r, key));

            if (ValidatorUtils.isRowValid(r)) { // update valid itemIds
                this._vehicleTypeNames.push(r.Id);
            }
        });
    }

    isVehicleTypeExist(typeName: string): boolean {
        return typeName && this._vehicleTypeNames.includes(typeName.toUpperCase());
    }
}
