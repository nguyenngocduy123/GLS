import { Component, OnInit } from '@angular/core';

import { VrpStorage } from '@app/vrp-common/classes/vrp-storage';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { PlannerDataService } from '@app/planner/services/planner-data.service';

@Component({
    selector: 'vrp-planner-notification-box',
    templateUrl: './planner-notification-box.component.html',
    styleUrls: ['./planner-notification-box.component.scss'],
})
export class PlannerNotificationBoxComponent implements OnInit {

    notificationMsg: VrpStorage;

    constructor(
        private _plannerData: PlannerDataService,
        private _authentication: VrpAuthenticationService,
    ) {
        this.notificationMsg = this._plannerData.notificationMsg;
    }

    ngOnInit() {
        if (!this._authentication.jobBellNotification) {
            this.notificationMsg.set([]);
        }
    }
}
