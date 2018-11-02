import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { share } from 'rxjs/operators';

import * as io from 'socket.io-client';

export interface IVrpWebsocketMessage {
    purpose?: 'create' | 'delete' | 'attempted' | 'logout';
    entity?: 'DeliveryDetail' | 'VehicleLocationLog';
    data?: any;
}

@Injectable({ providedIn: 'root' })
export class VrpWebsocketService {

    private _subscribersCounter: number = 0;
    private _ioSocket: any;

    constructor(
        @Inject('WEBSOCKET_URL') _url: string,
    ) {
        this._ioSocket = io(_url, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 99999,
        });
    }

    on(eventName: string, callback: Function) {
        console.log('VrpWebsocketService -> on -> listen ', eventName);
        return this._ioSocket.on(eventName, (msg) => {
            console.log('VrpWebsocketService -> on -> trigger', eventName);
            callback(msg);
        });
    }

    onJSON(eventName: string, callback: Function) {
        console.log(`VrpWebsocketService -> onJSON -> listen ${eventName}`);
        return this._ioSocket.on(eventName, (msgStr) => {
            console.log(`VrpWebsocketService -> onJSON -> trigger ${eventName}`, msgStr, this._ioSocket);
            try {
                const ws = JSON.parse(msgStr);
                callback(ws);
            } catch (err) {
                console.error(err);
            }
        });
    }

    once(eventName: string, callback: Function) {
        this._ioSocket.once(eventName, callback);
    }

    connect() {
        return this._ioSocket.connect();
    }

    disconnect() {
        this._ioSocket.disconnect();
    }

    emit(eventName: string, data?: any, callback?: Function) {
        return this._ioSocket.emit.apply(this._ioSocket, arguments);
    }

    removeListener(eventName: string, callback?: Function) {
        return this._ioSocket.removeListener.apply(this._ioSocket, arguments);
    }

    removeAllListeners() {
        return this._ioSocket.removeAllListeners.apply(this._ioSocket, arguments);
    }

    /** create an Observable from an event */
    fromEvent<T>(eventName: string): Observable<T> {
        this._subscribersCounter++;

        return Observable.create((observer: any) => {
            this._ioSocket.on(eventName, (data: T) => {
                observer.next(data);
            });
            return () => {
                if (this._subscribersCounter === 1) {
                    this._ioSocket.removeListener(eventName);
                }
            };
        }).pipe(share());
    }

    /* Creates a Promise for a one-time event */
    fromEventOnce<T>(eventName: string): Promise<T> {
        return new Promise<T>((resolve) => this.once(eventName, resolve));
    }
}
