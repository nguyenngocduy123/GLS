import { HttpClient, HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppSharedModule } from '@app/app-shared.module';
import { AppComponent } from '@app/vrp-common/components/app/app.component';
import { VrpMainComponent } from '@app/vrp-common/components/main/main.component';

/**
 * fileoverview  This file must only be called once in the root module
 */

// AoT requires an exported function for factories
export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export { AppComponent }; // component to be bootstrapped

@NgModule({
    imports: [
        AppSharedModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'xsrf-token',
            headerName: 'x-xsrf-token',
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient],
            },
            isolate: false,
        }),
    ],
    declarations: [
        AppComponent,
        VrpMainComponent,
    ],
    exports: [
        AppSharedModule,
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
    ],
})
export class AppModule {
    constructor(
        private _translate: TranslateService,
    ) {
        this._translate.setDefaultLang('en');
        const defaultLanguage = localStorage.getItem('language') || this._translate.getBrowserLang();
        console.log('TCL: AppSharedModule -> defaultLanguage', defaultLanguage);
        this._translate.use(defaultLanguage.match(/en|cn/) ? defaultLanguage : 'en');
    }
}
