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
        const itemErroredOrders = []; // orderIds with at least one delivery Item error
        data.forEach((r) => {
            let hasOrderError = false;
            if (prev && (!r.DeliveryMasterId || r.DeliveryMasterId.trim() === '')) {
                // read from previous row if order id is blank
                r.DeliveryMasterId = prev.DeliveryMasterId;
            }

            if (ValidatorUtils.checkAlphaNumeric(r, 'DeliveryMasterId')) {
                if (!this._orderValidator.isOrderIdExist(r.DeliveryMasterId)) {
                    hasOrderError = true;
                    if (!this._orderValidator.getOrderDetails(r.DeliveryMasterId)) {
                        ValidatorUtils.setError(r, 'Item', 'Order does not exist in import file');
                    } else {
                        ValidatorUtils.setError(r, 'Item', 'Order Error');
                    }
                }
            }
            r.ItemId = r.ItemId.toUpperCase();
            if (!this._itemValidator.isItemIdExist(r.ItemId)) {
                ValidatorUtils.setInExistError(r, 'ItemId');
            }

            ValidatorUtils.checkNonNegativeIntegerNumber(r, 'ItemQty');

            // add order error if 'DeliveryItems' has item specific errors
            if (!ValidatorUtils.isRowValid(r) && !itemErroredOrders.includes(r.DeliveryMasterId) && !hasOrderError) {
                itemErroredOrders.push(r.DeliveryMasterId);
                ValidatorUtils.setDeliveryItemError(this._orderValidator.getOrderDetails(r.DeliveryMasterId), 'Order');
            }
            prev = r;
        });
    }
}
