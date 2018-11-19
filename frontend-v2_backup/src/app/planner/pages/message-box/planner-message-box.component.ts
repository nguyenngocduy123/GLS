import { Component, OnDestroy, OnInit } from '@angular/core';
import { TdDataTableService } from '@covalent/core/data-table';
import { Subscription } from 'rxjs';
import * as subDays from 'date-fns/sub_days';
import * as compareDesc from 'date-fns/compare_desc';
import * as format from 'date-fns/format';
import * as isSameDay from 'date-fns/is_same_day';

import { PlannerUtils } from '@app/planner/classes/planner-utils';
import { PlannerDataService } from '@app/planner/services/planner-data.service';
import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { PlannerDialogService } from '@app/planner/services/planner-dialog.service';
import { IPlannerMessage, PlannerMessageRestService } from '@app/planner/services/planner-message-rest.service';

@Component({
    selector: 'vrp-planner-message-box',
    templateUrl: './planner-message-box.component.html',
    styleUrls: ['./planner-message-box.component.scss'],
})
export class PlannerMessageBoxComponent implements OnInit, OnDestroy {

    private _subscriptions: Subscription[] = [];

    jobQuery: { startDate: Date, endDate: Date };
    sidebarTitle: string = '0 new';

    messages: IPlannerMessage[] = [];
    filteredMessages: IPlannerMessage[] = [];
    searchTerm: string;

    selectedIndex: number = 0;
    selected: IPlannerMessage;

    groupBy: string = 'date';
    groupHeaders: string[];

    _dataTableService = new TdDataTableService();

    constructor(
        private _plannerData: PlannerDataService,
        private _messageRest: PlannerMessageRestService,
        private _dialog: PlannerDialogService,
        private _toast: VrpToastService,
    ) {
        this._plannerData.addListeners(['Message']);
    }

    ngOnInit() {
        const messageObject = this._plannerData.Message;

        this.jobQuery = { startDate: subDays(new Date(), 7), endDate: new Date() };
        this._plannerData.setMessageCachedObject(this.jobQuery, true);

        this._subscriptions = [
            messageObject.data$.subscribe((res) => {
                console.log('PlannerMessageBoxComponent -> ngOnInit -> Message:get', res);
                this.messages = res;
                this.filter();
                this._updateVariables();
            }, (err) => this._dialog.errorResponse(err)),

            messageObject.update$.subscribe((res) => {
                console.log('PlannerMessageBoxComponent -> ngOnInit -> Message:update', res);
                res.data.forEach((m) => {
                    const d = this.messages.find((t) => t.job.Id === m.job.Id);
                    if (d) {
                        Object.assign(d, m);
                    } else {
                        this.messages.push(m);
                    }
                });
                this.filter();
                console.log('PlannerMessageBoxComponent -> ngOnInit -> this.messages', this.messages);
                this._updateVariables();
            }),
        ];
    }

    ngOnDestroy() {
        this._subscriptions.forEach((s) => s.unsubscribe());
        this._plannerData.removeAllListeners();
    }

    onDateRangeChange(dateRange) {
        this._plannerData.setMessageCachedObject(dateRange, true);
    }

    refresh() {
        this._dialog.confirm('REFRESH_CHANGES_CONFIRM_MSG').subscribe((yes) => {
            if (yes) {
                this._plannerData.Message.refresh();
                this.searchTerm = undefined;
            }
        });
    }

    filter() {
        const tt = this.messages.filter((m) => this._plannerData.Message.shouldDataBeUpdated(m));
        console.log('PlannerMessageBoxComponent -> filter -> tt', tt);

        this.filteredMessages = PlannerUtils.filterArrayBySearchTerm(this.searchTerm, this.messages, ['driverRemarks', 'fromUsername', 'job.DeliveryMasterId', 'job.ContactName', 'job.Postal'])
            .sort((a, b) => {
                if (this.groupBy === 'date') {
                    return compareDesc(a.modified_date, b.modified_date);
                } else {
                    if (a.fromUsername !== b.fromUsername) {
                        return a.fromUsername < b.fromUsername ? -1 : 1;
                    } else {
                        return compareDesc(a.modified_date, b.modified_date);
                    }
                }
            });

        this.groupHeaders = this.filteredMessages.map((m, i) => {
            const prev = i > 0 ? this.filteredMessages[i - 1] : undefined;
            if (this.groupBy === 'date') {
                return (i === 0) || !isSameDay(m.modified_date, prev.modified_date) ? format(m.modified_date, 'MMM DD, YYYY') : undefined;
            } else {
                return (i === 0) || (m.fromUsername !== prev.fromUsername) ? (m.fromUser.fullname || m.fromUsername) : undefined;
            }
        });
    }

    openOrderDialog(orderId: string) {
        this._dialog.openOrderDetailById(orderId);
    }

    processMessage(m: IPlannerMessage) {
        this._messageRest.process(m).subscribe((newMsg) => {
            this.filter();
            this._toast.shortAlert('Message has been acknowledged');
        }, (err) => this._dialog.errorResponse(err));
    }

    private _updateVariables() {
        this.selected = this.messages[this.selectedIndex] || this.messages[0]; // keep selected message opened
        const nNew: number = this.messages.filter((m) => !m.processedByUsername).length;
        this.sidebarTitle = `${nNew} new`;

        this._messageRest.getUnprocessedMessagesCount().subscribe((nUnprocessed) => this.sidebarTitle = `${nNew} new, ${nUnprocessed - nNew} overdue`);
    }
}
