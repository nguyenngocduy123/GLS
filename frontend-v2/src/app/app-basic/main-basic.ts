import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';
import { environment } from '@environments/environment';
import { AppBasicModule } from './app-basic.module';

if (environment.production) {
    enableProdMode();
    window.console.log = function() { }; // disable all console log in production modev
}

platformBrowserDynamic().bootstrapModule(AppBasicModule);
