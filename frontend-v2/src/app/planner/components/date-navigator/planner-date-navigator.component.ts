import { Component, Output, Input, EventEmitter } from '@angular/core';

@Component({
    selector: 'vrp-planner-date-navigator',
    templateUrl: './planner-date-navigator.component.html',
    styleUrls: ['./planner-date-navigator.component.scss'],
})
export class PlannerDateNavigatorComponent {
    @Input() viewDate: Date = new Date();
    @Input() allowFuture: boolean = true;
    @Input() allowPast: boolean = true;

    @Input() readOnly: boolean = false;
    @Output() viewDateChange: EventEmitter<Date> = new EventEmitter();
    @Output() dateClick: EventEmitter<any> = new EventEmitter();

    constructor() { }
}
