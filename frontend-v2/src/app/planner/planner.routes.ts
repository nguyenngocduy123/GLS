import { Routes } from '@angular/router';

export const PLANNER_ROUTES: Routes = [
    { path: '', redirectTo: 'monitor' },
    { path: 'monitor', loadChildren: '@app/planner/pages/monitor/planner-monitor.module#PlannerMonitorModule' },
    { path: 'plan', loadChildren: '@app/planner/pages/plan/planner-plan.module#PlannerPlanModule' },
    { path: 'transaction', loadChildren: '@app/planner/pages/transaction-log/planner-transaction-log.module#PlannerTransactionLogModule' },
    { path: 'message-box', loadChildren: '@app/planner/pages/message-box/planner-message-box.module#PlannerMessageBoxModule' },
    { path: 'data-management', loadChildren: '@app/planner/pages/data-management/planner-data-management.module#PlannerDataManagementModule' },
    { path: 'data-import', loadChildren: '@app/planner/pages/data-import/planner-data-import.module#PlannerDataImportModule' },
];
