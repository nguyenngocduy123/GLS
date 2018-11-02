import { ValidatorUtils } from './validator-utils';

export class ItemValidator {

    private _itemIds: string[] = [];
    private _itemIdsOnDb: string[] = [];

    constructor(
        items: any[],
    ) {
        if (items) {
            this._itemIds = items.map((v) => v.Id.toUpperCase());
            this._itemIdsOnDb = items.map((v) => v.Id.toUpperCase());
        }
    }

    validate(data: any[]) {
        const previous = [];
        data.forEach((r) => {
            r.Id = r.Id.toUpperCase();
            if (!ValidatorUtils.isAlphaNumeric(r.Id)) { // validate Id
                ValidatorUtils.setNonAlphaNumericError(r, 'Id');
            } else {
                if (previous.includes(r.Id)) {
                    ValidatorUtils.setDuplicateError(r, 'Id');
                } else if (this._itemIdsOnDb.includes(r.Id.toUpperCase())) {
                    ValidatorUtils.setAlreadyExistError(r, 'Id');
                } else {
                    previous.push(r.Id);
                }
            }

            ValidatorUtils.checkNonNegativeNumber(r, 'Weight');

            if (ValidatorUtils.isRowValid(r)) {// update valid itemIds
                this._itemIds.push(r.Id.toUpperCase());
            }
        });
    }

    isItemIdExist(itemId: string): boolean {
        return itemId && this._itemIds.includes(itemId.toUpperCase());
    }
}
