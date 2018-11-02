import { Component, Input, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-items',
    templateUrl: './planner-items.component.html',
    styleUrls: ['./planner-items.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PlannerItemsComponent),
            multi: true,
        },
    ],
})
export class PlannerItemsComponent implements OnInit, ControlValueAccessor {

    @Input() readonly: boolean = false;
    allItems: any[] = [];
    selectableItems: any[] = [];

    newRow: any = { ItemId: undefined, ItemQty: 0, ActualItemQty: undefined };

    itemsValue: any[] = [];

    @Input() get Items() {
        return this.itemsValue;
    }

    set Items(val) {
        if (val) {
            this.itemsValue = [...val];
        } else {
            this.itemsValue = [];
        }

        this.propagateChange(this.itemsValue);
    }

    constructor(
        private _plannerRest: PlannerRestService,
    ) { }

    ngOnInit() {
        this._plannerRest.getItems().subscribe((res) => {
            this.allItems = res;
            this._updateSelectableItems();
        }, (err) => console.error(err));
    }

    propagateChange = (_: any) => { };

    writeValue(val: any): void {
        this.Items = val;
        this._updateSelectableItems();
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        // throw new Error('Method not implemented.');
    }

    deleteRow(i) {
        this.itemsValue.splice(i, 1);
        this._updateSelectableItems();
        this.update();
    }

    addRow() {
        const item = Object.assign({}, this.newRow);
        if (this.itemsValue) {
            this.itemsValue.push(item);
        } else {
            this.itemsValue = [item];
        }
        this.newRow = { ItemId: undefined, ItemQty: 0 };
        this._updateSelectableItems();
        this.update();
    }

    update() {
        this.propagateChange([...this.itemsValue]);
    }

    private _updateSelectableItems() {
        const currentItems = this.Items.map((d) => d.ItemId.toUpperCase());
        this.selectableItems = this.allItems.filter((i) => !currentItems.includes(i.Id.toUpperCase()));
    }
}
