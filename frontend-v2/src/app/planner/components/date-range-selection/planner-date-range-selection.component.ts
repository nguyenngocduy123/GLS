import { Component, Input, Output, EventEmitter } from '@angular/core';
import * as  addDays from 'date-fns/add_days';

import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';

interface IPlannerDateRange {
    startDate: Date;
    endDate: Date;
}

@Component({
    selector: 'vrp-planner-date-range-selection',
    templateUrl: './planner-date-range-selection.component.html',
    styleUrls: ['./planner-date-range-selection.component.scss'],
})
export class PlannerDateRangeSelectionComponent {

    @Input() range: IPlannerDateRange = { startDate: undefined, endDate: undefined };
    @Output() rangeChange: EventEmitter<IPlannerDateRange> = new EventEmitter();

    readonly dropdownMenu: any[] = [
        { label: 'Today', click: () => this.setDateRange(0, 0) },
        { label: 'Yesterday', click: () => this.setDateRange(-1, -1) },
        { label: 'Tomorrow', click: () => this.setDateRange(1, 1) },
        { label: 'Last 7 days', click: () => this.setDateRange(-7, 0) },
        { label: 'Next 7 days', click: () => this.setDateRange(0, 7) },
        { label: 'Custom Date Range', click: () => this.openDateRangeSelection() },
    ];

    constructor(
        private _dialog: PlannerDialogService,
    ) { }

    openDateRangeSelection() {
        this._dialog.openDateRangeSelection(this.range.startDate, this.range.endDate).subscribe((answer) => {
            if (answer) {
                console.log('PlannerDateRangeSelectionComponent -> openDateRangeSelection -> answer', answer);
                Object.assign(this.range, answer);
                this.rangeChange.emit(this.range);
            }
        });
    }

    setDateRange(shiftStart: number, shiftEnd: number) {
        this.range.startDate = addDays(new Date(), shiftStart);
        this.range.endDate = addDays(new Date(), shiftEnd);
        this.rangeChange.emit(this.range);
    }
}
