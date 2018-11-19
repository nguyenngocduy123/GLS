import { Injectable } from '@angular/core';
import { LoadingMode, LoadingType, TdLoadingService } from '@covalent/core/loading';
import { tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';
import * as isSameDay from 'date-fns/is_same_day';
import { get as _get } from 'lodash-es';

import { VrpToastService } from '@app/vrp-common/services/toast.service';
import { PlannerRestService, SqlTableNames } from './planner-rest.service';
import { PlannerJobQuery } from '@app/planner/classes/planner-job-query';
import { PlannerUtils } from '@app/planner/classes/planner-utils';
import { STATUS_LABELS } from '@app/planner/planner.config';
import { PlannerMessageRestService } from '@app/planner/services/planner-message-rest.service';
import { VrpCacheable, VrpLocalStorageService, VrpStorage, VrpWebsocketService } from '@app/vrp-common';
import { VrpAuthenticationService } from '@app/vrp-common/services/authentication.service';

interface IWSMessage {
    purpose: 'delete' | 'create' | 'update' | 'attempted';
    data: any;
}

@Injectable()
export class PlannerDataService {
    Item: VrpCacheable<any[]> = new VrpCacheable<any[]>();
    Vehicle: VrpCacheable<any[]> = new VrpCacheable<any[]>();
    VehicleType: VrpCacheable<any[]> = new VrpCacheable<any[]>();
    DeliveryDetail: VrpCacheable<any[]> = new VrpCacheable<any[]>();
    DeliveryMaster: VrpCacheable<any[]> = new VrpCacheable<any[]>();
    DeliveryPlan: VrpCacheable<any> = new VrpCacheable<any>();
    Message: VrpCacheable<any> = new VrpCacheable<any>();

    importedExcel: any = {}; // store imported excel data

    notificationMsg: VrpStorage; // store notification message

    onPlanChanged: Subject<any> = new Subject(); // fire if plan has been changed

    dispatchPanelToggled$: Subject<boolean> = new Subject(); // fire if dispatch panel open or close

    constructor(
        private _plannerRest: PlannerRestService,
        private _messageRest: PlannerMessageRestService,
        private _socket: VrpWebsocketService,
        private _localStorage: VrpLocalStorageService,
        private _loading: TdLoadingService,
        private _authentication: VrpAuthenticationService,
        private _toast: VrpToastService,
    ) {
        this.DeliveryDetail.queryObject = new PlannerJobQuery({ startDate: undefined, endDate: undefined, finishedJob: false });

        this.notificationMsg = this._localStorage.get('deliveryDetails.attempted', 15);

        this._loading.create({ name: 'fullscreen', mode: LoadingMode.Indeterminate, type: LoadingType.Circular, color: 'warn' });

        VrpCacheable.beforeDataQuery = () => this._loading.register('fullscreen');
        VrpCacheable.afterDataQuery = () => this._loading.resolve('fullscreen');

        this.Item.getDataHandler = () => this._plannerRest.getItems(true);
        this.Vehicle.getDataHandler = () => this._plannerRest.getVehicles(undefined, true);
        this.VehicleType.getDataHandler = () => this._plannerRest.getVehicleTypes(true);
    }

    addListeners(listenerType: string[]) {
        // listen to socket IO
        ['DeliveryDetail', 'VehicleType', 'Vehicle', 'Item'].filter((e: SqlTableNames) =>
            listenerType.includes(e)).forEach((t: SqlTableNames) => {
                this._socket.onJSON(t, (msg: IWSMessage) => {
                    if (this._authentication.user) {
                        this._socketUpdate(t, msg);
                    }
                });
            });

        if (listenerType.includes('DeliveryMaster')) {
            this._socket.onJSON('DeliveryMaster', (msg) => {
                if (this._authentication.user) {
                    this._socketUpdateDeliveryMaster(msg);
                }
            });
        }

        if (listenerType.includes('Message')) {
            this._socket.onJSON('Message', (msg) => {
                if (this._authentication.user) {

                    this._socketUpdateMessage(msg);
                }
            });
        }

        if (listenerType.includes('DeliveryPlan')) {
            this._socket.onJSON('DeliveryPlan', (msg) => {
                if (this._authentication.user) {
                    this._socketUpdateDeliveryPlan(msg);
                }
            });
        }

        this._socket.onJSON('logout', () => {
            if (this._authentication.user) {
                this.clearCache();
            }
        });
    }

    removeAllListeners() {
        this._socket.removeAllListeners();
    }

    get(tableName: SqlTableNames): VrpCacheable<any[]> {
        return this[tableName] as VrpCacheable<any[]>;
    }

    /**
     * change getDataHandler for DeliveryDetail when date range changed
     */
    setDeliveryDetailCachedObject(s: PlannerJobQuery, refresh: boolean = true) {
        const c = this.DeliveryDetail;
        if (!c.queryObject.isSameWith(s)) {
            Object.assign(c.queryObject, s);
            c.getDataHandler = () => this._plannerRest.getDeliveryDetails(c.queryObject.startDate, c.queryObject.endDate, c.queryObject.getStatusQuery(), true);
            c.shouldDataBeUpdated = (d): boolean => c.queryObject.isJobCached(d, c.cachedData) || c.queryObject.isJobSatisfyQuery(d);
        }

        if (refresh) {
            c.refresh();
        }
    }

    setMessageCachedObject(dateRange: { startDate: any, endDate: any }, refresh: boolean = true) {
        const c = this.Message;

        c.queryObject = dateRange;
        c.getDataHandler = () => this._messageRest.getAll(c.queryObject.startDate, c.queryObject.endDate);
        c.shouldDataBeUpdated = (d): boolean => PlannerUtils.isWithinDateRange(d.modified_date, c.queryObject.startDate, c.queryObject.endDate);

        if (refresh) {
            c.refresh();
        }
    }

    setDeliveryPlanCachedObject(date: Date, refresh: boolean = true) {
        const _isOrderCompleted = (order): boolean => [11].indexOf(order.status) > -1;

        const c = this.DeliveryPlan;

        c.queryObject = date;
        c.getDataHandler = () => this._plannerRest.getProblemJson(c.queryObject)
            .pipe(tap((p) => {
                p.services = p.services.filter((o) => !_isOrderCompleted(o));
                p.shipments = p.shipments.filter((o) => !_isOrderCompleted(o));
                p.solutions.forEach((s) => s.checked = false);

                // obtain due time
                p.services.forEach((s) => {
                    s.dueTime = _get(s, 'time_windows[0].end');
                    if ('DELIVERY' === s.type.toUpperCase()) {
                        s.deliveryDue = s.dueTime;
                    } else {
                        s.pickupDue = s.dueTime;
                    }
                });
                p.shipments.forEach((s) => {
                    s.dueTime = _get(s, 'delivery_time_windows[0].end');
                    s.deliveryDue = s.dueTime;
                    s.pickupDue = _get(s, 'pickup_time_windows[0].end');
                    // shipment status
                    if (s.pickup_status === s.delivery_status) {
                        s.status = s.pickup_status;
                    }
                });
            }));

        if (refresh) {
            c.refresh();
        }
    }

    clearCache() {
        this.Item.clearCache();
        this.Vehicle.clearCache();
        this.VehicleType.clearCache();
        this.DeliveryDetail.clearCache();
        this.DeliveryMaster.clearCache();
        this.DeliveryPlan.clearCache();
        this.Message.clearCache();
    }

    private _socketUpdate(tableName: SqlTableNames, ws: IWSMessage) {
        console.log('PlannerDataService -> _socketUpdate -> msg', ws);
        if (!ws || !ws.data || !ws.purpose) {
            return;
        }

        const c: VrpCacheable<any[]> = this.get(tableName);
        if (ws.purpose !== 'delete') {
            ws.data = ws.data.filter((d) => c.shouldDataBeUpdated(d));
        }

        const affected: any[] = PlannerUtils.updateCreateAndRemoveAccordingToWS(ws, c.cachedData || [], tableName, c.queryObject); // update cached data

        if (affected.length > 0) {
            console.log('PlannerDataService -> _socketUpdate -> affected', affected);
            if (ws.purpose === 'attempted') {
                affected.forEach((d) => {
                    const alertMsg: string = `Delivered ${d.DeliveryMasterId} (${d.JobType}) : ${STATUS_LABELS[d.Status]} on ${(new Date(d.ActualDeliveryTime)).toLocaleTimeString()}`; // inform user
                    if (this._authentication.jobBellNotification) {
                        this.notificationMsg.unshift(d); // push to notification
                    }
                    this._showDataToastMessage(alertMsg);
                });
            } else {
                const alertMsg: string = `Table ${tableName}: ${(affected.length)} items have been ${ws.purpose}d`;
                this._showDataToastMessage(alertMsg);
            }
            c.updateSubject.next({ data: affected, purpose: ws.purpose }); // send updated data to subcribers
        } else {
            console.log('PlannerDataService -> _socketUpdate -> No affected items');
        }
    }

    private _socketUpdateDeliveryMaster(ws: IWSMessage) {
        console.log('PlannerDataService -> _socketUpdateDeliveryMaster -> msg', ws);

        if (!ws || !ws.data || !ws.purpose) {
            return;
        }

        const c: VrpCacheable<any[]> = this.DeliveryDetail;

        let affected: any[] = [];
        if (['update', 'create'].includes(ws.purpose)) {
            const updatedJobs: any[] = [];
            ws.data.forEach((order) => {
                if (order.DeliveryDetails) {
                    order.DeliveryDetails.forEach((job) => {
                        if (c.shouldDataBeUpdated(job)) {
                            updatedJobs.push(this._updateJob(job, order));
                        }
                    });
                }

                const d = c.cachedData.find((t) => t.DeliveryMasterId === order.Id);
                if (d) {
                    d.DeliveryMaster.CustomerName = order.CustomerName;
                    d.DeliveryMaster.CustomerPhone = order.CustomerPhone;
                    d.DeliveryMaster.CustomerEmail = order.CustomerEmail;
                    updatedJobs.push(this._updateJob(d, order));
                }
            });

            affected = PlannerUtils.updateItemsToArray(updatedJobs, c.cachedData);
        } else if (ws.purpose === 'delete') {
            const deletedJobIds: any[] = c.cachedData.filter((d) => ws.data.includes(d.DeliveryMasterId)).map((d) => d.Id);
            affected = PlannerUtils.removeItemsFromArray(deletedJobIds, c.cachedData);
        }

        if (affected.length > 0) {
            console.log('PlannerDataService -> _socketUpdateDeliveryMaster -> affected', affected);
            const alertMsg: string = `Orders: ${(affected.length)} items have been ${ws.purpose}d`;
            this._showDataToastMessage(alertMsg);
            c.updateSubject.next({ data: affected, purpose: ws.purpose }); // send updated data to subcribers
        }
    }

    private _socketUpdateDeliveryPlan(ws: IWSMessage) {
        console.log('PlannerDataService -> _socketUpdateDeliveryPlan -> msg', ws);

        if (!ws || !ws.data || !ws.purpose) {
            return;
        }

        const c: VrpCacheable<any> = this.DeliveryPlan;

        if (['update', 'create'].includes(ws.purpose)) {
            if (isSameDay(ws.data, c.queryObject)) {
                c.refresh(); // send updated data to subcribers
                this._showDataToastMessage(`PLANNER_PLAN.NEWPLAN_APPROVED_MSG`);
            }
        }
    }

    private _socketUpdateMessage(msg: IWSMessage) {
        console.log('PlannerDataService -> _socketUpdateMessage -> msg', msg);

        if (!msg || !msg.data || !msg.purpose) {
            return;
        }

        const c: VrpCacheable<any> = this.Message;

        const affected: any[] = msg.data.filter((d) => c.shouldDataBeUpdated(d));
        console.log('private_socketUpdateMessage -> affected', affected, msg.data, c.queryObject);
        if (['update', 'create'].includes(msg.purpose)) {
            if (this._authentication.msgToastNotification) {
                const alertMsg: string = `Message: ${(affected.length)} messages have been ${msg.purpose}d`;
                this._toast.shortAlert(alertMsg);
            }
            c.updateSubject.next({ data: affected, purpose: msg.purpose }); // send updated data to subcribers
        }
    }

    private _showDataToastMessage(mgs: string) {
        if (this._authentication.dataToastNotification) {
            this._toast.shortAlert(mgs);
        }
    }

    private _updateJob(job, order): any {
        job.VehicleId = order.VehicleId;
        job.Priority = order.Priority;
        job.VehicleRestriction = order.VehicleRestriction;
        job.UserGroup = order.UserGroup;
        return job;
    }
}
