import { Component, EventEmitter, Input, Output } from '@angular/core';
import * as format from 'date-fns/format';

@Component({
    selector: 'vrp-datetime-input',
    templateUrl: './vrp-datetime-input.component.html',
    styleUrls: ['./vrp-datetime-input.component.scss'],
})
export class VrpDatetimeInputComponent {

    @Input() label: string;
    @Input() disabled: boolean = false;

    _date: string;
    @Input() set date(d: Date) {
        this._date = this.toDateString(new Date(d));
    }

    @Output() dateChange: EventEmitter<Date>;

    constructor() {
        this.date = new Date();
        this.dateChange = new EventEmitter();
    }

    onDateChange(value: string): void {
        if (value !== this._date) {
            const parsedDate = this.parseDateString(value);
            // check if date is valid first
            if (!isNaN(parsedDate.getTime())) {
                this._date = value;
                this.dateChange.emit(parsedDate);
            }
        }
    }

    private toDateString(date: Date): string {
        return format(date, 'YYYY-MM-DDTHH:mm');
    }

    private parseDateString(date: string): Date {
        date = date.replace('T', '-');
        const parts: string[] = date.split('-');
        const timeParts: string[] = parts[3].split(':');

        // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), parseInt(timeParts[0], 10), parseInt(timeParts[1], 10)); // Note: months are 0-based
    }
}
