import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { TdLoadingService } from '@covalent/core/loading';
import { finalize } from 'rxjs/operators';
import { CalendarEvent } from 'angular-calendar';
import * as isSameMonth from 'date-fns/is_same_month';
import * as startOfDay from 'date-fns/start_of_day';
import * as endOfMonth from 'date-fns/end_of_month';
import * as startOfMonth from 'date-fns/start_of_month';

import { STATUS_COLORS, STATUS_LABELS } from '@app/planner/planner.config';
import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-date-selection-dialog',
    templateUrl: './planner-date-selection-dialog.component.html',
    styleUrls: ['./planner-date-selection-dialog.component.scss'],
})
export class PlannerDateSelectionDialogComponent {

    title: string;
    cancelButton = 'CLOSE';
    acceptButton = 'SELECT';

    events: CalendarEvent[] = [];
    viewDate: Date = new Date();
    selectedDate: Date;

    constructor(
        private _loading: TdLoadingService,
        private _plannerRest: PlannerRestService,
        @Inject(MAT_DIALOG_DATA) private data: any,
    ) {
        this.viewDate = new Date(this.data.viewDate);
        this._loadMonthData(true);
    }

    dayClicked({ date, events }: { date: Date, events: CalendarEvent[] }): void {
        this.selectedDate = date;
    }

    changeMonth(d: Date) {
        if (!isSameMonth(d, this.viewDate)) {
            this.viewDate = d;
            this._loadMonthData(true);
        }
    }

    private _loadMonthData(forceRefresh: boolean = false) {
        this._loading.register('planner-date-selection.load');
        this._plannerRest.getSummary(startOfMonth(this.viewDate), endOfMonth(this.viewDate), forceRefresh)
            .pipe(finalize(() => this._loading.resolve('planner-date-selection.load')))
            .subscribe((monthData) => {
                this.events = []; // clear old data of this month
                monthData.forEach((dayData) => {// add new data of this month
                    const date = new Date(dayData.date);
                    dayData.numJobsByStatus.sort((a, b) => a.status - b.status).forEach((r) => {
                        if (r.count !== 0) {
                            const e = { title: `${r.count} ${STATUS_LABELS[r.status]}`, shortTitle: r.count, start: startOfDay(date), allDay: true, color: STATUS_COLORS[r.status] };
                            this.events.push(e);
                        }
                    });
                });

            }, (err) => {
                console.error(err);
            });
    }
}
