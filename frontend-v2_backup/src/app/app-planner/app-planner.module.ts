import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { environment } from '@environments/environment';
import { VrpHttpInterceptor } from '@app/vrp-common';
import { AppModule, AppComponent } from '@app/app.module';
import { AppPlannerRoutingModule } from './app-planner-routing.module';

const BACKEND_URL = environment.backEndUrl;

@NgModule({
    imports: [
        AppModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory,
        }),
        AppPlannerRoutingModule,
    ],
    providers: [
        Title,
        { provide: HTTP_INTERCEPTORS, useClass: VrpHttpInterceptor, multi: true, },
        { provide: 'WEBSOCKET_URL', useValue: `${BACKEND_URL}/` },
        { provide: 'AUTHENTICATION_BASE_URL', useValue: `${BACKEND_URL}/web/auth` },
        { provide: 'MAP_BASE_URL', useValue: `${BACKEND_URL}/map` },
        { provide: 'MAP_REST_BASE_URL', useValue: `${BACKEND_URL}/web/map` },
        { provide: 'USER_BASE_URL', useValue: `${BACKEND_URL}/web/user` },
        { provide: 'PROBLEM_REST_BASE_URL', useValue: `${BACKEND_URL}/web/problem` },
        { provide: 'USER_GROUP_REST_BASE_URL', useValue: `${BACKEND_URL}/web/usergroup` },
        { provide: 'MESSAGE_REST_BASE_URL', useValue: `${BACKEND_URL}/web/message` },
        { provide: 'PLANNER_REST_BASE_URL', useValue: `${BACKEND_URL}/web/data` },
    ],
    bootstrap: [
        AppComponent,
    ],
})
export class AppPlannerModule { }
