- [SIMTech VRP Driver](#simtech-vrp-driver)
    - [Known Bugs](#known-bugs)
    - [Programming Guide](#programming-guide)
        - [Exceptions](#exceptions)
        - [Additional](#additional)
        - [Linting](#linting)
        - [Template Files](#template-files)
- [Installation](#installation)
    - [Step 1-5: Programs Required](#step-1-5-programs-required)
    - [Step 6-8: Run (Development)](#step-6-8-run-development)
    - [Step 9-11: Deploy (Production)](#step-9-11-deploy-production)
    - [Step 12: Maintenance](#step-12-maintenance)
- [Ionic Plugins](#ionic-plugins)
- [Help](#help)
    - [Error Type 1: Authentication failed](#error-type-1-authentication-failed)
    - [Error Type 2: git-sh-setup: file not found](#error-type-2-git-sh-setup-file-not-found)
    - [Error Type 3: Build APK failed](#error-type-3-build-apk-failed)
    - [Plugins with Variable](#plugins-with-variable)
    - [Crashes](#crashes)
    - [`package.json`](#packagejson)

---------------------

# SIMTech VRP Driver

Driver application for vrp-nodejs

**Framework**: Ionic3, Angular5

**Language**: TypeScript

**Supported OS**: Android 5+, iOS 10+

## Known Bugs

**Android**

- Phone redirects to login page when internet is lost (affects selective devices only - e.g. Huawei P10)

**iOS**

- Websocket message not received when application is (1) in background and (2) phone is locked

## Programming Guide

[Style Guide for Angular](https://angular.io/guide/styleguide)

[Commit Message Convention](http://karma-runner.github.io/1.0/dev/git-commit-msg.html)

[Comment Convention](http://usejsdoc.org/)

Recommended to use `Document This` extension in VSCode for commenting

`npm run lint` uses `tslint` instead of `ionic-app-scripts lint` because `ionic-app-scripts lint` does not support autofix.

### Exceptions

To be consistent with [vrp-frontend](https://bitbucket.org/chinhnguyenquoc/vrp-frontend/), there are a few exceptions.

1. Add prefix `vrp-` to components
    + Example: `ionic generate component vrp-jobtype-label`

2. Prefix interfaces with `I`
> **Style 03-03**
> Consider naming an interface without an I prefix.

3. Private properties (i.e. variables) are prefixed with an underscore.
> **Style 03-04**
> Avoid prefixing private properties and methods with an underscore.

### Additional

1. [Initialise all array properties that is referenced in a template at the point of declaration](https://forum.ionicframework.com/t/navcontroller-push-appears-to-push-page-but-does-not-display-it/106980/2)

2. All dates must be initialised with `moment`. If `Date` is needed, then use `moment().toDate()` instead.
- This is to ensure the date is synchronised with the server.

3. Service worker is not recommended because `https` origin is required, and we cannot guarantee all servers will run on `https`.

### Linting

Linting uses Ionic's (`npm run lint`).

### Template Files

Use `ionic generate` to [generate starter files (e.g. components, pipes, etc)](https://ionicframework.com/docs/cli/generate/)

Example: `ionic g component vrp-header`

---------------------

# Installation

## Step 1-5: Programs Required

Step 1: **Install third-party programs**

**Install Java 1.8** - Install version 8 of Java JDK/JRE via  [oracle.com](http://www.oracle.com/technetwork/java/javase/downloads/index.html)

**Install Git** - Install the latest version via [git-scm.com](https://git-scm.com/downloads)

**Install Android Studio** - Install the latest version via [developer.android.com](https://developer.android.com/)

1. Add the following to your PATH env variable.
    + `%USERPROFILE%\AppData\Local\Android\sdk\platform-tools`
    + `%USERPROFILE%\AppData\Local\Android\sdk\build-tools\...`
        - Replace `...` with the build number installed

**Install Npm** - Install the latest stable version via [nodejs.org](https://nodejs.org/en/)

Step 2: **Install build tools for Android APK**

**SDK Tools**

* Android SDK Build-Tools
* Android Emulator
* Android SDK Platform-Tools
* Android SDK Tools
* Google Play Services
* Google USB Driver
* Support Repository (All)

**SDK Platforms**

* Android 7.1.1

Step 3: **Install libraries**

1. `npm run init` - This will install cordova, ionic globally and necessary files

This script will take at least 5 minutes to run. Don't panic if the script gets stuck somewhere.

[Refer to Help section if you need help](#markdown-header-help)

Step 4: **Check programs are installed correctly**

1. `npm run versions`

Step 5: **Check for issues in project**

* `ionic doctor check`

## Step 6-8: Run (Development)

Step 6. **Run project**

* `npm run start` to run on browser
* `npm run android` to run on Android device that is connected to computer
* `npm run android` to run on Android device with liveloading enabled

Refer to `package.json` for full list of scripts.

Step 7: **Run tests**

(To be included in the future)

_Libraries_

* karma
    + Purpose: Environment for unit tests
* jasmine
    + Purpose: Unit test framework
* protractor
    + Purpose: Environment for end-to-end tests

Step 8: **Performance Analysis**

(To be included in the future)

## Step 9-11: Deploy (Production)

Step 9: **Deploy project**

`gulp --tasks` to see the list of gulp scripts available

Warning: DO NOT run the gulp scripts simultaneously. The script will rebuild `www`.

**To increment version**

*`gulp bump --(flag) (accepted values)`

| Flag | Accepted Values     | Required? | Default Value |
| ---- | ------------------- | --------- | ------------- |
| type | major, minor, patch | No        | patch         |

**To build APK**

1. `gulp bump ...` (if necessary)
1. If you have a custom build configuration file, move it to __scripts__ /build-`<SUFFIX>`.json, where <SUFFIX> is any identifier you want
1. `gulp build-apk --(flag) (accepted values)`

| Flag   | Accepted Values | Required? | Default Value | Remarks                                                       |
| ------ | --------------- | --------- | ------------- | ------------------------------------------------------------- |
| os     | android, ios    | Yes       |               |                                                               |
| type   | debug, release  | No        | debug         |                                                               |
| domain | glsapp, glsopms | No        | localhost     |                                                               |
| suffix |                 | No        |               | Example: __scripts__/build-local.json - `local` is the suffix |
| reset  |                 | No        |               | Deletes all apk-* files in the folder                         |

**To publish to npm**

1. `gulp bump ...` (if necessary)
1. `gulp publish`

Step 10: **HTTPS**

* If `Globals.features.enableSSLPinning` is `true`, there must be at least one .cer SSL certificate in `/src/certificates`.

> See [https://github.com/silkimen/cordova-plugin-advanced-http#enablesslpinning](https://github.com/silkimen/cordova-plugin-advanced-http#enablesslpinning)

> If you only have a .pem certificate see this [stackoverflow answer](http://stackoverflow.com/a/16583429/3182729). You want to convert it to a DER encoded certificate with a .cer extension.

Step 11: **New Deployment**

Assuming the driver application is based on ready-to-go package:

1. Add company logo to `/__scripts__/assets`
2. Add SSL certificate (if any) to `/__scripts__/certs`
3. Modify `publish.js`
    1. Ctrl+F > `options.domain.startsWith('gls')` > Add another `if else` with proper `config`
    2. Ctrl+F > `// valid options: glsapp, glsopms` > Update comments accordingly

## Step 12: Maintenance

Step 12: **Maintenance**

1. Upgrade cordova plugins
    1. `npm i cordova-check-plugins -g`
    2. `cordova-check-plugins`
1. Upgrade npm packages*
    1. Method 1
        1. Version Lens (vscode extension)
        1. Open package.json
    1. Method 2
        1. `npm install -g npm-check-updates`
        1. `ncu`
1. Delete /platforms and /plugins folder
1. `npm run android:init` or `npm run ios:init`

*Remember to remove any `^` from package versions

---------------------

# Ionic Plugins

* [App Version](https://ionicframework.com/docs/native/app-version/)
    + [x] Checks whether the application is outdated
* [Premium Background Geolocation](https://github.com/transistorsoft/cordova-background-geolocation-lt)
    + [x] Gets driver geolocation in the background
* [Barcode Scanner](https://ionicframework.com/docs/native/barcode-scanner/)
    + [x] Used to scan barcodes for items, and qr code for server url
* [Base64](https://ionicframework.com/docs/native/base64/)
    + [x] Used to open image files that were stored on the device
    + **Important**: It may not work in iOS. [File](https://ionicframework.com/docs/native/file/) was not used because it only works on run version, but not build.
* [Camera](https://ionicframework.com/docs/native/camera/)
    + [x] Used to take pictures for note photos
* [Diagnostic](https://ionicframework.com/docs/native/diagnostic/)
    + [x] Used to redirect user to settings page when permissions are missing
* [Globalisation](https://ionicframework.com/docs/native/globalization/)
    + For displaying language and date format according to phone's settings
* [Status Bar](https://ionicframework.com/docs/native/status-bar/)
    + [x] For changing status bar colour whenever there is no Internet connection
* [Launch Navigator](https://ionicframework.com/docs/native/launch-navigator/)
    + [x] For navigating user from current location to destination
    + [Action Sheet](https://ionicframework.com/docs/native/action-sheet/)
        - [Due to bug with how cordova handles library dependencies, this plugin needs to be added to the config.xml.](https://github.com/dpa99c/phonegap-launch-navigator/issues/184)
* [Local Notifications](https://ionicframework.com/docs/native/local-notifications/)
    + [x] Display local notification when driver have new jobs for today
* [Location Accuracy](https://ionicframework.com/docs/native/location-accuracy/)
    + Allow user to change location settings without exiting application
* [Network](https://ionicframework.com/docs/native/network/)
    + [x] To inform user when there is no Internet connection
* [Photo Viewer](https://ionicframework.com/docs/native/photo-viewer/)
    + [x] To view images in full screen with zooming capabilities
* [Splash Screen](https://ionicframework.com/docs/native/splash-screen/)
    + [x] To show a splash screen to prevent user from interacting with the app before the native components are ready
* [SQLite](https://ionicframework.com/docs/native/sqlite/)
    + [x] Used to store completed job information when Internet connection is unavailable

---------------------

# Help

## Error Type 1: Authentication failed

Do you see `npm ERR! fatal: Authentication failed for 'https://github.com/transistorsoft/cordova-background-geolocation.git/'` in your error logs?
    + Make sure you are using `simtechpom` credentials for GitHub login.
    + If same error still happens, `git config --global credential.helper wincred`

## Error Type 2: git-sh-setup: file not found

Do you see `npm ERR! C:\Program Files\Git\mingw64/libexec/git-core\git-submodule: line 19: .: git-sh-setup: file not found` in your error logs?
    + Go to git bash - usually located at `C:\Program Files\Git\bin\bash.exe`, or `bash`
    + Run `ionic cordova prepare` via the bash instead of Windows CMD

## Error Type 3: Build APK failed

Do you see `Error occurred during initialization of VM. Could not reserve enough space for 2097152KB object heap` in your error logs?
    + Set environment variable `_JAVA_OPTION` as `-Xmx512m -Xms512m`

## Plugins with Variable

Last updated on 13 October 2018, 10:00 AM

Variables such as Android versions must be checked properly. In case some newer plugin version require upgraded `variable` versions.

**Geolocation**

`ionic cordova plugin add cordova-background-geolocation-lt@2.13.2 --variable LICENSE="6433036445aedcafc210cf04ead2345ed7f705ce9b7c98d75ed8e06dd58db56d" --variable LOCATION_ALWAYS_AND_WHEN_IN_USE_USAGE_DESCRIPTION="Background location-tracking is required" --variable LOCATION_ALWAYS_USAGE_DESCRIPTION="Background location-tracking is required" --variable LOCATION_WHEN_IN_USE_USAGE_DESCRIPTION="Background location-tracking is required" --variable MOTION_USAGE_DESCRIPTION="Using the accelerometer increases battery-efficiency by intelligently toggling location-tracking only when the device is detected to be moving" --variable BACKGROUND_MODE_LOCATION="&lt;string&gt;location&lt;/string&gt;"`

**Launch Navigator**

`ionic cordova plugin add uk.co.workingedge.phonegap.plugin.launchnavigator --variable LOCATION_USAGE_DESCRIPTION="This app requires access to your location for navigation purposes" --variable OKHTTP_VERSION="3.+"`

**phonegap-plugin-barcodescanner**

`ionic cordova plugin add phonegap-plugin-barcodescanner --variable ANDROID_SUPPORT_V4_VERSION="27.+" --variable CAMERA_USAGE_DESCRIPTION="This application requires camera permission to scan barcodes and QR codes."`

## Crashes

`adb logcat AndroidRuntime:E *:S` to see crash logs

`adb logcat` to see all logs

## `package.json`

**Do not** use caret (`^`) in package.json to prevent incorrect plugin versions in config.xml

**Do not** update any packages that is linked to Angular (Some plugins may not support Angular 6)

Prefix `@angular`

Prefix `@ngx-translate`

`rxjs`

`zone.js`

`ts-node`

`typescript`

**Avoid** upgrading the following packages due to Ionic versioning. (Can be upgraded, but might break)

`ionicons`
