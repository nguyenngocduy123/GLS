import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';

export interface IVrpNavListSettings {
    title?: string;
    numbering?: boolean;
    selected?: any[];
    // selectActions?: any[];
    filter: Function;
    headerActions?: any[];
    headerMenuActions?: any[];
    itemClick?: Function;
    itemSelect?: Function;
    itemTemplateRef: Function;
    footerTemplateRef: Function;
    summaryText?: string;
    itemMenuActions?: any[];
    dense?: boolean;
}

@Component({
    selector: 'vrp-nav-list',
    templateUrl: './vrp-nav-list.component.html',
    styleUrls: ['./vrp-nav-list.component.scss'],
})
export class VrpNavListComponent implements OnInit, OnChanges {

    iHighlighted: number = -1;

    filtered: any[] = [];

    @Input() data: any[];
    @Input() footerData: any[];
    @Input() title: string;

    @Input() settings: IVrpNavListSettings;
    @Input() searchMaxWidth: number = 150;

    @ViewChild('searchBox') searchBoxCtrl;

    constructor() { }

    ngOnInit() {
        this.filter();
    }

    ngOnChanges(changes) {
        if (changes.data && !changes.data.firstChange) {
            this.iHighlighted = -1;
            if (this.searchBoxCtrl) {
                this.searchBoxCtrl._searchInput.clearSearch();

                if (this.searchBoxCtrl.searchVisible) {
                    this.searchBoxCtrl.toggleVisibility();
                }
            }
            this.filter();
        }
    }

    filter(searchString: string = undefined) {
        if (this.data) {
            this.filtered = this.data.filter((item) => (searchString) ? this.settings.filter(searchString, item) : true);
        } else {
            this.filtered = [];
        }
        this._updateSelected();
    }

    itemClick(item, index) {
        this.iHighlighted = index;
        if (this.settings.itemClick instanceof Function) {
            this.settings.itemClick(item);
        }
    }

    itemSelectAll(checked: boolean) {
        this.filtered.forEach((item) => {
            item.checked = checked;
            if (this.settings.itemClick instanceof Function) {
                this.settings.itemSelect(item, true); // set as true when all items selected
            }
        });
        this._updateSelected();
    }

    itemCheckedChange(checked, item) {
        this._updateSelected();
        if (this.settings.itemClick instanceof Function) {
            this.settings.itemSelect(item);
        }
    }

    private _updateSelected() {
        if (this.settings.selected) {
            this.settings.selected = this.filtered.filter((d) => d.checked);
        }
    }
}
