import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { IMyDrpOptions } from 'mydaterangepicker';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

@Component({
    selector: 'vrp-planner-custom-search-dialog',
    templateUrl: './planner-custom-search-dialog.component.html',
    styleUrls: ['./planner-custom-search-dialog.component.scss'],
})
export class PlannerCustomSearchDialogComponent {

    title: string = 'Select Date Range';

    cancelButton: string = 'CANCEL';
    acceptButton: string = 'SAVE';

    myDateRangePickerOptions: IMyDrpOptions = {
        dateFormat: 'mmm dd, yyyy',
        inline: true,
        showApplyBtn: false,
    };

    dateRange: any = {};

    maxDateRange: number = 31;

    isRangeValid: boolean = true;

    constructor(
        private _dialogRef: MatDialogRef<PlannerCustomSearchDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        if (this.data.start) {
            this.dateRange.beginJsDate = this.data.start;
            this.dateRange.beginDate = {
                year: this.data.start.getFullYear(),
                month: this.data.start.getMonth() + 1,
                day: this.data.start.getDate(),
            };
        }

        if (this.data.end) {
            this.dateRange.endJsDate = this.data.end;
            this.dateRange.endDate = {
                year: this.data.end.getFullYear(),
                month: this.data.end.getMonth() + 1,
                day: this.data.end.getDate(),
            };
        }

        this.checkRange(this.dateRange);
    }

    save() {
        if (this.isRangeValid) {
            this._dialogRef.close({ startDate: this.dateRange.beginJsDate, endDate: this.dateRange.endJsDate });
        }
    }

    checkRange(dateRange) {
        if (dateRange) {
            const noDays: number = differenceInCalendarDays(dateRange.endJsDate, dateRange.beginJsDate);
            this.isRangeValid = (noDays < this.maxDateRange);
        } else {
            this.isRangeValid = false;
        }
    }
}
