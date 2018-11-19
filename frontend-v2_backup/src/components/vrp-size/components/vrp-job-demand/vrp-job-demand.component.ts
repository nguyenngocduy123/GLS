import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'vrp-job-demand',
  templateUrl: './vrp-job-demand.component.html',
  styleUrls: ['./vrp-job-demand.component.scss'],
})
export class VrpJobDemandComponent {
    _size: Number[] = [];

    @Input() items: string[];
    @Input() set size(values: Number[]) {
        if (values) {
            this._size = values;
        }
    }

    @Output() sizeChange: EventEmitter<Number[]> = new EventEmitter<Number[]>();

    constructor() { }

    onChange() {
        this.sizeChange.emit([...this._size]);
    }

}
