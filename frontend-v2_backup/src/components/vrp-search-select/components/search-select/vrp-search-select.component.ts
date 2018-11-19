import { Component, EventEmitter, Input, OnDestroy, OnInit, OnChanges, Output, TemplateRef, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { ReplaySubject, Subject } from 'rxjs';

@Component({
    selector: 'vrp-search-select',
    templateUrl: './vrp-search-select.component.html',
    styleUrls: ['./vrp-search-select.component.scss'],
})
export class VrpSearchSelectComponent implements OnInit, OnDestroy, OnChanges {

    private _onDestroy = new Subject<void>();
    private _selectedOption: any;

    @Input() optionTemplate: TemplateRef<any>;
    @Input() unselectOptionTemplate: TemplateRef<any>;

    @Input() selections: any[];
    @Input() searchFields: string[];
    @Input() valueField: string;

    @Input() isCaseSensitive: boolean = false;

    @Input() showUndefinedOption: boolean = false;

    @Input() placeholder: string = 'Select';

    selectCtrl: FormControl = new FormControl(); // control for the selected bank
    selectFilterCtrl: FormControl = new FormControl(); // control for the MatSelect filter keyword

    filteredSelections: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    @Output() selectedChange: EventEmitter<any> = new EventEmitter<any>();

    ngOnInit() {
        // listen for search field value changes
        this.selectFilterCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                this.filterSelections();
            });
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.selections && this.selections) {
            // load the initial bank list
            this.filteredSelections.next(this.selections.slice());
            // console.log('VrpSearchSelectComponent -> ngOnInit -> this.selections', this.selections);
        }
    }

    @Input()
    get selected() {
        return this._selectedOption;
    }

    set selected(value) {
        this._selectedOption = value;
        this.selectedChange.emit(this._selectedOption);
        if (this.selections) {
            this.filteredSelections.next(this.selections.slice().sort((x, y) => x === value ? -1 : y === value ? 1 : 0));
        }
    }

    private filterSelections() {
        if (!this.selections) {
            return;
        }

        const searchValue = this.selectFilterCtrl.value;
        if (!searchValue) {
            this.filteredSelections.next(this.selections.slice());
            return;
        }

        const filteredOptions = this.selections.filter((v) => !this.searchFields.every(
            (f) => !v[f] || !(v[f].toLowerCase().includes(searchValue.toLowerCase())),
        ));

        this.filteredSelections.next(filteredOptions);
    }
}
