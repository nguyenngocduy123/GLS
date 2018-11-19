import { Component, Input, OnInit } from '@angular/core';

import { PlannerRestService } from '@app/planner/services/planner-rest.service';

@Component({
    selector: 'vrp-planner-pod',
    templateUrl: './planner-pod.component.html',
    styleUrls: ['./planner-pod.component.scss'],
})
export class PlannerPodComponent implements OnInit {

    @Input() job: any = {};

    constructor(
        private _plannerRest: PlannerRestService,
    ) { }

    ngOnInit() {
        if (!this.job.pod && this.job.Id) {
            this._plannerRest.getPOD(this.job.Id).subscribe((res) => {
                this.job.pod = res;
            }, (err) => console.error('Failed to get POD', err));
        }
    }
}
