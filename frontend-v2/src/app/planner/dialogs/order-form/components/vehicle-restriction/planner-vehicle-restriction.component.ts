import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { startsWith as _startsWith } from 'lodash-es';
import { shareReplay } from 'rxjs/operators';

import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-vehicle-restriction',
    templateUrl: './planner-vehicle-restriction.component.html',
    styleUrls: ['./planner-vehicle-restriction.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PlannerVehicleRestrictionComponent),
            multi: true,
        },
    ],
})
export class PlannerVehicleRestrictionComponent implements ControlValueAccessor {
    allVehicleTypes;
    allVehicles;

    readonly restrictionGroup: any[] = [
        { label: 'Allowed Vehicles', values: [], selected: [], prefix: '' },
        { label: 'Restricted Vehicles', values: [], selected: [], prefix: '#' },
        { label: 'Allowed Vehicle Types', values: [], selected: [], prefix: '@' },
        { label: 'Restricted Vehicle Types', values: [], selected: [], prefix: '#@' },
    ];

    _restrictionValue: string;
    get restrictionValue(): string {
        return this._restrictionValue || '';
    }

    set restrictionValue(val: string) {
        this._restrictionValue = val;
        this.propagateChange(this._restrictionValue);
        this._setValueToChips(this._restrictionValue);
    }

    constructor(
        private _plannerRest: PlannerRestService,
    ) {
        this.allVehicleTypes = this._plannerRest.getVehicleTypes().pipe(shareReplay(1));
        this.allVehicles = this._plannerRest.getVehicles().pipe(shareReplay(1));
    }

    propagateChange = (_: any) => { };

    writeValue(val: any): void {
        this.restrictionValue = val;
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
        // throw new Error("Method not implemented.");
    }

    onSelectionChange(group, values) {
        const groupIndex = this.restrictionGroup.indexOf(group);
        const counterGroup = this.restrictionGroup[(groupIndex <= 1 ? 1 : 5) - groupIndex];
        group.selected = values;
        counterGroup.selected = this._diff(counterGroup.selected, values); // find the difference because rules under same category (vehicle/vehicletype) are mutually exclusive
        this._restrictionValue = this._getValueFromChips();
        this.propagateChange(this._restrictionValue);
    }

    private _diff(a, b) {
        return a.filter((i) => b.indexOf(i) === -1);
    }

    private _getValueFromChips(): string {
        const _restriction: any[] = [];
        this.restrictionGroup.forEach((e) => {
            e.selected.forEach((s) => _restriction.push(e.prefix + s));
        });

        return _restriction.join(',');
    }

    private _setValueToChips(v: string) {
        if (v) {
            this.restrictionGroup.forEach((i) => i.selected = []);
            const prefixes: string[] = this.restrictionGroup.map((i) => i.prefix);
            const values: string[] = v.split(',');

            values.forEach((e: string) => {
                let i = 0;
                if (_startsWith(e, '#@')) {
                    i = 3;
                } else if (_startsWith(e, '@')) {
                    i = 2;
                } else if (_startsWith(e, '#')) {
                    i = 1;
                }
                this.restrictionGroup[i].selected.push(e.replace(prefixes[i], '')); // should map with vehicle type's name
            });
        }
    }
}
