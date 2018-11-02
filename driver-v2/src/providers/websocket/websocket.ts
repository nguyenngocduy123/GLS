/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Injectable } from '@angular/core';
import * as io from 'socket.io-client/dist/socket.io';

import { Globals } from '../../globals';

/**
 * Possible values for purpose of a websocket message received
 *
 * @enum {string}
 */
export enum WebsocketPurpose {
    Create = 'create',
    Update = 'update',
    Delete = 'delete',
    Attempted = 'attempted',
}

/**
 * Possible values for event of a websocket message received
 *
 * @enum {string}
 */
export enum WebsocketEvent {
    DeliveryMaster = 'DeliveryMaster',
    DeliveryDetail = 'DeliveryDetail',
    DeliveryItem = 'DeliveryItem',
    DeliveryPlan = 'DeliveryPlan',
    Vehicle = 'Vehicle',
    Logout = 'logout',
}

@Injectable()
export class WebsocketProvider {
    private socket: SocketIOClient.Socket;

    private eventsToCreate: { name: WebsocketEvent, successFn: Function, errorFn: Function }[] = []; // list of events to create when socket is ready

    constructor() { }

    /**
     * Establish websocket connection to the server
     */
    connect(): void {
        if (Globals.features.enableWebsocket === false) {
            // ignore subsequent codes if feature is not enabled
            return;

        } else if (this.socket !== undefined && this.socket.connected === true) {
            console.log(`[WEBSOCKET] Already connected to websocket`);

        } else {
            let serverUrl = Globals.url;
            if (Globals.default.setApiHeader) {
                serverUrl += `?${Globals.default.apiHeader}=${Globals.user.token}`;
            }

            console.log(`[WEBSOCKET] Connecting to ${serverUrl}`);
            this.socket = io(serverUrl); // needs to be here instead of constructor in case url changes

            if (this.eventsToCreate.length) {
                this.eventsToCreate.forEach((event) => this.onJSON(event.name, event.successFn, event.errorFn));
                this.eventsToCreate = [];
            }

        }
    }

    /**
     * Disconnect websocket connectivity
     */
    disconnect(): void {
        if (Globals.features.enableWebsocket === false) {
            // ignore subsequent codes if feature is not enabled
            return;

        } else if (this.socket !== undefined && this.socket.connected === true) {
            // remove listener is not required because connection will be disconnected
            this.socket.disconnect();
        }
    }

    /**
     * Listen to a websocket event
     *
     * @param {WebsocketEvent} eventName  Name of event to listen
     * @param {Function} successCallback  Callback when a message is received
     * @param {Function} [errorCallback]  Callback when an error is received
     */
    onJSON(eventName: WebsocketEvent, successCallback: Function, errorCallback?: Function): void {
        // https://stackoverflow.com/questions/32875824/socket-io-how-to-replace-event-listener-on-client
        // check if an event has listener (does not allow same topics to be listened more than once)
        if (Globals.features.enableWebsocket === false || this.socket.hasListeners(eventName)) {
            // ignore subsequent codes if feature is not enabled
            return;

        } else if (!this.socket) {
            // handles scenario where this function is called before socket is initialised
            this.eventsToCreate.push({ name: eventName, successFn: successCallback, errorFn: errorCallback });

        } else {
            this.socket.on(eventName, (msgStr: string) => {
                try {
                    const msg = JSON.parse(msgStr);
                    console.log(`[WEBSOCKET] Event: (${eventName}). Message:`, msg);
                    if (successCallback) { successCallback(msg); }
                } catch (err) {
                    console.log(`[WEBSOCKET] Event: (${eventName}). Message:`, msgStr, err);
                    if (errorCallback) { errorCallback(err); }
                }
            });
        }
    }
}
