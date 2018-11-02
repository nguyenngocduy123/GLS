import { ValidatorUtils } from './validator-utils';
import { ItemValidator } from './item-validator';
import { OrderValidator } from './order-validator';

export class DeliveryItemValidator {
    constructor(
        private _itemValidator: ItemValidator,
        private _orderValidator: OrderValidator,
    ) {

    }

    validate(data: any[]) {

        let prev = undefined;
        data.forEach((r) => {
            if (prev && (!r.DeliveryMasterId || r.DeliveryMasterId.trim() === '')) {
                // read from previous row if order id is blank
                r.DeliveryMasterId = prev.DeliveryMasterId;
            }

            if (ValidatorUtils.checkAlphaNumeric(r, 'DeliveryMasterId')) {
                if (!this._orderValidator.isOrderIdExist(r.DeliveryMasterId)) {
                    // ValidatorUtils.setInExistError(r, 'OrderId');
                    ValidatorUtils.setError(r, 'OrderId', 'Invalid');
                }
            }
            r.ItemId = r.ItemId.toUpperCase();
            if (!this._itemValidator.isItemIdExist(r.ItemId)) {
                ValidatorUtils.setInExistError(r, 'ItemId');
            }

            ValidatorUtils.checkNonNegativeIntegerNumber(r, 'ItemQty');

            prev = r;
        });
    }
}
