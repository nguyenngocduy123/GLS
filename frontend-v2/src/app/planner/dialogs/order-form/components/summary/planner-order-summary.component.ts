import { Component, Input } from '@angular/core';

@Component({
    selector: 'vrp-planner-order-summary',
    templateUrl: './planner-order-summary.component.html',
    styleUrls: ['./planner-order-summary.component.scss'],
})
export class PlannerOrderSummaryComponent {

    @Input() order: any = {};
    disabled: boolean = true;

    constructor() { }
}
