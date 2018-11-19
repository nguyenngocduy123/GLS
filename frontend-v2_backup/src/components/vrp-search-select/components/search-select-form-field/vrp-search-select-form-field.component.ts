import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { MatFormFieldControl, MatSelectChange } from '@angular/material';
import { FormControl, NgControl, ControlValueAccessor } from '@angular/forms';
import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, Optional, Self, SimpleChanges, TemplateRef, Output, EventEmitter } from '@angular/core';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'vrp-search-select-form-field',
    templateUrl: './vrp-search-select-form-field.component.html',
    styleUrls: ['./vrp-search-select-form-field.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: VrpSearchSelectFormFieldComponent }],
})
export class VrpSearchSelectFormFieldComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor, MatFormFieldControl<any> {

    private static _nextId: number = 0;
    private _required = false;

    private _onDestroy = new Subject<void>();

    private _disabled = false;

    get shouldLabelFloat() { return this.focused || !this.empty; }

    private _placeholder: string = 'Select';

    stateChanges = new Subject<void>();
    id: string = `vrp-search-select-form-field-${VrpSearchSelectFormFieldComponent._nextId++}`;

    focused: boolean;

    errorState: boolean = false;
    controlType: string = 'vrp-search-select-form-field';

    describedBy = '';

    selectCtrl: FormControl = new FormControl();
    selectFilterCtrl: FormControl = new FormControl(); // control for the MatSelect filter keyword

    filteredSelections: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    @Input()
    get placeholder() { return this._placeholder; }
    set placeholder(plh) {
        this._placeholder = plh;
        this.stateChanges.next();
    }
    @Input()
    get required() { return this._required; }
    set required(req) {
        this._required = coerceBooleanProperty(req);
        this.stateChanges.next();
    }

    @Input()
    get disabled() { return this._disabled; }
    set disabled(dis) {
        this._disabled = coerceBooleanProperty(dis);
        this.stateChanges.next();
    }

    @Input() optionTemplate: TemplateRef<any>;
    @Input() optionTemplateName: string;
    // @Input() _optionTemplateName: string;
    // get optionTemplateName(): string {
    // 	return this._optionTemplateName;
    // }

    // set optionTemplateName(val: string) {
    // 	this._optionTemplateName = val;
    // 	this.optionTemplate = this.defaultOptionTemplate;
    // }

    @Input() unselectOptionTemplate: TemplateRef<any>;
    @Input() unselectOptionLabel: string = '-- None --';

    @Input() selections: any[];
    @Input() searchFields: string[];
    @Input() valueField: string;

    @Input() isCaseSensitive: boolean = false;
    @Input() showUndefinedOption: boolean = false;

    @Input() multiple: boolean = false;

    @Output() selectionChange: EventEmitter<MatSelectChange> = new EventEmitter();

    onChange: (value: number) => void;
    onTouched: () => void;

    constructor(
        private fm: FocusMonitor,
        private elRef: ElementRef,
        @Optional() @Self() public ngControl: NgControl,
    ) {
        // Setting the value accessor directly (instead of using the providers) to avoid running into a circular import.
        if (this.ngControl) {
            this.ngControl.valueAccessor = this;
        }

        fm.monitor(elRef.nativeElement, true).subscribe((origin) => {
            this.focused = !!origin;
            this.stateChanges.next();
        });
    }

    writeValue(obj: any): void {
        this.value = obj;
    }

    registerOnChange(fn: any): void {
        this.onChange = (value) => {
            fn(value);
            this.stateChanges.next();
        };
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDescribedByIds(ids: string[]) {
        this.describedBy = ids.join(' ');
    }

    onContainerClick(event: MouseEvent) {
        this.elRef.nativeElement.querySelector('mat-select').focus();
    }

    ngOnInit() {
        // listen for search field value changes
        this.selectCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe((v) => {
            if (this.onChange) { this.onChange(v); }
        });

        this.selectFilterCtrl.valueChanges.pipe(takeUntil(this._onDestroy)).subscribe(() => {
            this.filterSelections();
        });
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();

        this.stateChanges.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.selections && this.selections) {
            this.filteredSelections.next(this.selections.slice());
        }
    }

    @Input()
    get value() {
        return this.selectCtrl.value;
    }

    set value(value) {
        this.selectCtrl.setValue(value);
        if (this.selections) {
            this.filteredSelections.next(this.selections.slice().sort((x, y) => x === value ? -1 : y === value ? 1 : 0));
        }
        this.stateChanges.next();
    }

    get empty() {
        return !this.selectCtrl.value;
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
