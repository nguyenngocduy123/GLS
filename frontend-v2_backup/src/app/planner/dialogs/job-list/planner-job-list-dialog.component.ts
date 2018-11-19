
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material';

import { SQL_TABLE_CONFIG } from '@app/planner/planner.config';
import { PlannerOrderDetailDialogComponent } from '@app/planner/dialogs/order-form/planner-order-form.module';

@Component({
    selector: 'vrp-planner-job-list-dialog',
    templateUrl: './planner-job-list-dialog.component.html',
    styleUrls: ['./planner-job-list-dialog.component.scss'],
})
export class PlannerJobListDialogComponent {

    title: string = '';

    tableHeight: number = 800;
    tableColumn: any[] = SQL_TABLE_CONFIG['DeliveryDetail'];
    tableData: any[] = [];

    tableItemActions: any[] = [
        {
            tooltip: 'Open', icon: 'launch', click: (order) => {
                this._mdDialog.open(PlannerOrderDetailDialogComponent, {
                    maxWidth: '100vw', maxHeight: '100vh',
                    data: { orderId: order.DeliveryMasterId, readOnly: false },
                }).afterClosed();
            },
        },
    ];

    constructor(
        private _mdDialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) data: any,
    ) {
        this.tableHeight = window.innerHeight - 125;
        Object.assign(this, data);
    }
}
