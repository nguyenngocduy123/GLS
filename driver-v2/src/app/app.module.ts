/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';

import { AppVersion } from '@ionic-native/app-version';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Camera } from '@ionic-native/camera';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Base64 } from '@ionic-native/base64';
import { Diagnostic } from '@ionic-native/diagnostic';
import { HTTP } from '@ionic-native/http';
import { Keyboard } from '@ionic-native/keyboard';
import { LaunchNavigator } from '@ionic-native/launch-navigator';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Network } from '@ionic-native/network';
import { PhotoViewer } from '@ionic-native/photo-viewer';
import { SQLite } from '@ionic-native/sqlite';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { MyApp } from './app.component';
import { AuthProvider } from '../providers/user/auth';
import { NativeHTTP } from '../providers/driver-rest/native-http';
import { AuthApi, JobsApi, ItemApi, MailApi, VehicleApi, MiscApi } from '../providers/driver-rest/driver-rest';
import { CameraProvider } from '../providers/camera/camera';
import { CurrentJobProvider } from '../providers/current-job/current-job';
import { DiagnosticProvider } from '../providers/diagnostic/diagnostic';
import { GeolocationProvider } from '../providers/geolocation/geolocation';
import { LoadingProvider } from '../providers/loading/loading';
import { NotificationProvider } from '../providers/notification/notification';
import { StorageProvider } from '../providers/storage/storage';
import { UserDriverProvider } from '../providers/user/user-driver';
import { WebsocketProvider } from '../providers/websocket/websocket';

// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [
        MyApp,
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        IonicModule.forRoot(MyApp, {
            tabsPlacement: 'top',
            tabsHideOnSubPages: true,
            scrollAssist: false,
            autoFocusAssist: false,
            activator: 'highlight',
        }),
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
    ],
    providers: [
        // interceptors
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        // utils
        CameraProvider,
        DiagnosticProvider,
        GeolocationProvider,
        LoadingProvider,
        NotificationProvider,
        StorageProvider,
        WebsocketProvider,
        // http api requests
        NativeHTTP,
        AuthApi,
        ItemApi,
        JobsApi,
        MailApi,
        MiscApi,
        VehicleApi,
        // data service
        AuthProvider,
        CurrentJobProvider,
        UserDriverProvider,
        // native plugins
        AppVersion,
        Camera,
        BackgroundMode,
        BarcodeScanner,
        Base64,
        Diagnostic,
        HTTP,
        Keyboard,
        LaunchNavigator,
        LocalNotifications,
        Network,
        PhotoViewer,
        SQLite,
        StatusBar,
        SplashScreen,
    ],
})
export class AppModule { }
