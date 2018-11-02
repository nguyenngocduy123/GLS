/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { JobStatus, JobType } from './providers/classes/job';

/**
 * List of menus identifiers in the application
 *
 * @enum {string}
 */
export enum MenuName {
    AllJobs = 'allJobsMenu',
}

/**
 * Key used for key-value pairs in local storage
 *
 * @enum {string}
 */
export enum StorageKey {
    Eula = 'eula',
    Url = 'url',
    Username = 'username',
    ApiToken = 'token',
    PreviousJobsInfo = 'previousJobsInfo',
}

/**
 * The source of input for items handled page
 *
 * @enum {number}
 */
export enum ItemInputMethod {
    Keyboard,
    Barcode,
}

/**
 * Key-value pairing for text and color
 *
 * @interface IColorPair
 */
interface IColorPair {
    color: string;
    title: string;
}

/**
 * Application-wide configuration / settings and values.
 * Some values need to be defined before compiling.
 * Some values may be overwritten by input from server
 *
 * @class Globals
 */
export class Globals {
    private static defaultUrl = 'https://glsapp.com.sg';

    private static _url: string = Globals.defaultUrl;
    static get url(): string { return Globals._url; }
    static set url(serverUrl) { Globals._url = serverUrl ? serverUrl.replace(/[\/\\]+$/, '') : ''; } // remove prepended slashes

    /**
     * `````````````````````````````````````````````
     * These values must be defined before compiling (will not change at run-time)
     *
     * `````````````````````````````````````````````
     */
    static readonly default = {
        url: Globals.defaultUrl,
        apiHeader: 'x-access-token', // header key to pass api token as. required for background tracking
        setApiHeader: true, // set true if append token to normal api requests as well
    };
    static readonly login = {
        page: 'LoginPage',
        image: {
            path: 'assets/images/logo_company.png',
            height: '50px', // specify unit (e.g. px) as well
        },
    };
    static readonly home = {
        page: 'HomePage',
        title: 'GLS', // html tags allowed
    };
    static readonly features = {
        forceAppUpdate: true,
        /**
         * GUI
         */
        showEula: false,
        showChangeUrl: false, // allow server url to be modified by drivers. if false, defaultUrl must be specified
        showAllJobsMenu: true,
        showPodPhotoTab: true,
        showChangePassword: true,
        showChangeDriverInfo: true, // change driver / vehicle information
        showJobsMail: true, // message to planner
        showJobsReorderBtn: false, // allow driver to reorder jobs in all jobs page (incomplete feature)
        /**
         * Major features
         */
        enableSSLPinning: true, // if true, showChangeUrl MUST be false
        enableWebsocket: true,
        enableGeoTracking: true,
        enableOfflineSync: true,
    };

    /**
     * `````````````````````````````````````````````
     * These values may be overwritten at run-time.
     * Some of these values can be defined in the server's setting file.
     * If not defined in server's setting file, the value here will be used
     *
     * `````````````````````````````````````````````
     */
    static readonly user = {
        username: '',
        token: '',
        previousJobsInfo: '',
        vehicleId: '',
        vehiclePlateNumber : '',
        vehicleUserGroup: '',
    };
    /**
     * TODO: Change [status: string] to [status: JobStatus] and [jobtype: string] to [jobtype: JobType] when fixed
     * https://github.com/Microsoft/TypeScript/issues/13042
     */
    static readonly jobStatusPair: { [status: string]: IColorPair } = {
        [JobStatus.Pending]: { title: 'Pending', color: 'blue' },
        [JobStatus.Late]: { title: 'Late', color: 'orange' },
        [JobStatus.Ontime]: { title: 'Ontime', color: 'green' },
        [JobStatus.Unsuccessful]: { title: 'Unsuccessful', color: 'red' },
        [JobStatus.ExpectToBeLate]: { title: 'Expect Late', color: 'purple' },
    };
    static readonly jobTypePair: { [jobtype: string]: IColorPair } = {
        [JobType.Pickup]: { title: 'PICKUP', color: 'orange' },
        [JobType.Delivery]: { title: 'DELIVERY', color: 'blue' },
    };
    static setting = {
        note: {
            maxNumPhoto: 3,
            optionRequired: false,
            options: [
                'No problem',
                'Incomplete order',
                'Customer unavailable',
                'Damaged product',
            ],
        },
        pod: {
            photoRequired: false,
        },
        item: {
            defaultInput: ItemInputMethod.Keyboard,
            allowSwitchInput: true,
            acceptedCodes: 'DATA_MATRIX,UPC_A,UPC_E,EAN_8,EAN_13,CODE_39,CODE_128,ITF', // https://github.com/phonegap/phonegap-plugin-barcodescanner#using-the-plugin
        },
    };
}
