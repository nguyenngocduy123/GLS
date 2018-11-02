import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { environment } from '@environments/environment';

import { AppPlannerModule } from './app-planner.module';

if (environment.production) {
    enableProdMode();
    window.console.log = function() { }; // disable all console log in production mode
    window.console.debug = function() { }; // disable all console log in production mode
}

platformBrowserDynamic().bootstrapModule(AppPlannerModule);
