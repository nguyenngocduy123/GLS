import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import * as subDays from 'date-fns/sub_days';
import * as compareDesc from 'date-fns/compare_desc';

import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { IPlannerMessage, PlannerMessageRestService } from '@app/planner/services/planner-message-rest.service';

@Component({
    selector: 'vrp-planner-mail-notification',
    templateUrl: './planner-mail-notification.component.html',
    styleUrls: ['./planner-mail-notification.component.scss'],
})
export class PlannerMailNotificationComponent implements OnInit, OnDestroy {

    private _subscriptions: Subscription[] = [];

    messages: IPlannerMessage[] = [];
    sortedMsgs: IPlannerMessage[] = [];
    msgCount: number = 0;
    jobQuery: { startDate: Date, endDate: Date };

    constructor(
        private _router: Router,
        private _plannerData: PlannerDataService,
        private _messageRest: PlannerMessageRestService,
        private _authentication: VrpAuthenticationService,
    ) {
        this._updateCount();
    }

    ngOnInit() {
        const messageObject = this._plannerData.Message;
        this.jobQuery = { startDate: subDays(new Date(), 7), endDate: new Date() }; // fetch last 7 days messages
        this._plannerData.setMessageCachedObject(this.jobQuery);

        this._subscriptions = [
            messageObject.data$.subscribe((res) => {
                console.log('PlannerMailNotificationComponent -> ngOnInit -> Message:get', res);
                this.messages = res;
                this._filter();
                this._updateCount();
            }, (err) => console.error('', err)),

            messageObject.update$.subscribe((res) => {
                console.log('PlannerMailNotificationComponent -> ngOnInit -> Message:update', res);
                res.data.forEach((m) => {
                    const d = this.messages.find((t) => t.job.Id === m.job.Id);
                    if (d) {
                        Object.assign(d, m);
                    } else {
                        this.messages.push(m);
                    }
                });
                this._filter();
                this._updateCount();
            }),
        ];
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
    }

    openMessageScreen() {
        this._router.navigate(['planner', 'message-box'], { queryParams: { canGoBack: true, backUrl: this._router.url } });
    }

    private _filter() {
        const newMsgs = this.messages.filter((msg) => !msg.processedBy);
        this.sortedMsgs = newMsgs.sort((a, b) => {
            return compareDesc(a.modified_date, b.modified_date);
        });
    }

    private _updateCount() {
        if (this._authentication.msgBellNotification) {
            this._messageRest.getUnprocessedMessagesCount().subscribe((nUnprocessed) => this.msgCount = nUnprocessed);
        } else {
            this.msgCount = 0;
        }
    }
}
