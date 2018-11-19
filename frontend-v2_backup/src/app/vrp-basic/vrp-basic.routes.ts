import { Routes } from '@angular/router';

export const VRP_BASIC_ROUTES: Routes = [
    { path: '', redirectTo: 'dashboard' },
    { path: 'dashboard', loadChildren: '@app/vrp-basic/pages/dashboard/dashboard.module#VrpDashboardModule' },
    { path: 'problem-detail', loadChildren: '@app/vrp-basic/pages/problem-detail/vrp-problem-detail.module#VrpProblemDetailModule' },
];
