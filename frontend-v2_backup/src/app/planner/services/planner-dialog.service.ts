import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { IVrpOptimizationDialogData, VrpOptimizationSettingsDialogComponent } from '@app/vrp-basic/dialogs/optimization-settings/optimization-settings-dialog.component';
import { PLANNER_OPTIMIZATION_CONFIG, PLANNING_ORDER_SELECTION_CONFIG, PLANNING_VEHICLE_SELECTION_CONFIG } from '@app/planner/planner.config';
import { VrpDialogService } from '@components/vrp-dialog';
import {
    PlannerOrderDetailDialogComponent,
    PlannerCustomSearchDialogComponent,
    PlannerDateSelectionDialogComponent,
    PlannerItemDetailDialogComponent,
    PlannerVehicleDetailDialogComponent,
    PlannerVehicleTypeDetailDialogComponent,
    PlannerJobListDialogComponent,
} from '@app/planner/dialogs';

const DEFAULT_WIDTH = '100vw';
const DEFAULT_HEIGHT = '100vh';

@Injectable()
export class PlannerDialogService extends VrpDialogService {
    // get content from vrp cacheable
    openOrderDetail(order: any, readOnly: boolean = true): Observable<any> {
        return this.openWithConfig(PlannerOrderDetailDialogComponent, {
            maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
            minWidth: DEFAULT_WIDTH, minHeight: DEFAULT_HEIGHT,
            data: { order, readOnly },
        });
    }

    // query server
    openOrderDetailById(orderId: string, readOnly: boolean = true): Observable<any> {
        return this.openWithConfig(PlannerOrderDetailDialogComponent, {
            maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
            minWidth: DEFAULT_WIDTH, minHeight: DEFAULT_HEIGHT,
            data: { orderId, readOnly },
        });
    }

    openJobList(data: any[], title: string = 'Order '): Observable<Date> {
        return this.openWithConfig(PlannerJobListDialogComponent, {
            maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
            data: { tableData: data, title },
        });
    }

    openOptimizationSelection(data: IVrpOptimizationDialogData): Observable<any> {
        return this.openWithConfig(VrpOptimizationSettingsDialogComponent, {
            maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
            data: Object.assign({}, data, {
                optimizationConfig: PLANNER_OPTIMIZATION_CONFIG,
                vehicleColumns: PLANNING_VEHICLE_SELECTION_CONFIG,
                orderColumns: PLANNING_ORDER_SELECTION_CONFIG,
            }),
        });
    }

    openDateSelection(viewDate: Date): Observable<Date> {
        return this.openWithConfig(PlannerDateSelectionDialogComponent, {
            maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
            data: { viewDate: viewDate },
        });
    }

    openDateRangeSelection(start: Date = new Date(), end: Date = new Date()): Observable<any> {
        return this.open(PlannerCustomSearchDialogComponent, { start, end });
    }

    openTimeRangeSelection(start: string = '00:00', end: string = '23:59'): Observable<any> {
        const formElements = [
            { name: 'start', label: 'Start Time', type: 'time', default: start },
            { name: 'end', label: 'End Time', type: 'time', default: end },
        ];

        return this.openDynamicEdit(formElements, undefined, 'Select date range', 1);
    }

    openVehicleDetail(value: any, driverUsers: any[], isPowerPlanner: boolean = false): Observable<any> {
        return this.open(PlannerVehicleDetailDialogComponent, { value, driverUsers, isPowerPlanner });
    }

    openVehicleTypeDetail(value: any, allVehicleTypeNames: string[]): Observable<any> {
        return this.open(PlannerVehicleTypeDetailDialogComponent, { value, allVehicleTypeNames });
    }

    openItemDetail(value: any, allItemIds: string[] = []): Observable<any> {
        return this.open(PlannerItemDetailDialogComponent, { value, allItemIds });
    }

    // openExcelDataImport(data): Observable<any> {
    //     return this.openWithConfig(PlannerDataImportDialogComponent, {
    //         maxWidth: DEFAULT_WIDTH, maxHeight: DEFAULT_HEIGHT,
    //         data: { data },
    //     });
    // }
}
