/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Globals, ItemInputMethod } from '../../globals';

interface INoteOptions {
    option: { required: boolean, list: string[] };
    photo: { maxCount: number };
}

interface IPodOptions {
    photo: { required: boolean };
}

interface IItemOptions {
    input: { default: 'BARCODE' | 'TEXT', allowToggle: boolean };
    barcode: { formats: string };
}

interface IStatusLabel {
    value: number;
    label: string;
}

export class AuthResponse {
    username: string;
    role: string;
    fullname: string;
    token: string;
    serverDate: string;
    forceChangePassword: boolean = false;

    vehicleId?: string;
    vehiclePlateNumber?: string;
    vehicleUserGroup?: string;

    noteOptions: INoteOptions = {
        option: {
            required: Globals.setting.note.optionRequired,
            list: Globals.setting.note.options,
        },
        photo: {
            maxCount: Globals.setting.note.maxNumPhoto,
        },
    };
    podOptions: IPodOptions = {
        photo: {
            required: Globals.setting.pod.photoRequired,
        },
    };
    itemOptions: IItemOptions = {
        input: {
            default: (Globals.setting.item.defaultInput ===  ItemInputMethod.Barcode) ? 'BARCODE' : 'TEXT',
            allowToggle: Globals.setting.item.allowSwitchInput,
        },
        barcode: {
            formats: Globals.setting.item.acceptedCodes,
        },
    };
    statusLabels: IStatusLabel[] = [];

    constructor(init?: Partial<AuthResponse>) {
        Object.assign(this, init);
    }
}
