import { Component, Input, Output, EventEmitter } from '@angular/core';

import { PREDEFINED_TIMESLOTS } from '@components/vrp-table/vrp-table.config';

interface ITimeRangeFilter {
    label?: string;
    start: string;
    end: string;
}

@Component({
    selector: 'vrp-time-filter-menu',
    templateUrl: './vrp-time-filter-menu.component.html',
    styleUrls: ['./vrp-time-filter-menu.component.scss'],
})
export class VrpTimeFilterMenuComponent {

    @Input() predefinedTimeRange: ITimeRangeFilter[] = PREDEFINED_TIMESLOTS;

    @Output() applyFilter: EventEmitter<ITimeRangeFilter> = new EventEmitter();

    range: ITimeRangeFilter = { start: '00:00', end: '23:59' };

    constructor() { }
}
