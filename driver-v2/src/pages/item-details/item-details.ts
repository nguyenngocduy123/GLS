/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component } from '@angular/core';
import { IonicPage, ViewController, NavParams } from 'ionic-angular';

import { ItemApi } from '../../providers/driver-rest/driver-rest';
import { Item } from '../../providers/classes/item';
import { IDeliveryItem } from '../../providers/classes/job';
import { NotificationProvider } from '../../providers/notification/notification';

@IonicPage()
@Component({
    selector: 'page-item-details',
    templateUrl: 'item-details.html',
})
export class ItemDetailsPage {
    item: Item;

    constructor(
        public itemApi: ItemApi,
        public navParams: NavParams,
        public notify: NotificationProvider,
        public viewCtrl: ViewController,
    ) { }

    ionViewCanEnter() {
        const deliveryItem: IDeliveryItem = this.navParams.get('deliveryItem');
        if (deliveryItem === undefined) {
            return false;
        }

        return this.itemApi.get(deliveryItem.ItemId)
            .then((item: Item) => this.item = item)
            .catch((err) => {
                this.notify.error('Unable to get item details.', err);
                throw err;
            });
    }

    btnClose() {
        this.viewCtrl.dismiss();
    }
}
