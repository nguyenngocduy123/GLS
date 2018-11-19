import * as format from 'date-fns/format';
import { each as _each, find as _find, get as _get, isNumber as _isNumber, isEmpty as _isEmpty, last as _last, size as _size } from 'lodash-es';

import { VrpUtils } from '@app/vrp-common';

export interface ISolution {
    id: string;
    routes: any[];
}

/* tslint:disable:variable-name */
// engine input are based on snake cases
export class Problem {
    _id: any;
    name: string = 'Untitled';
    fleet_size: string = 'FINITE';
    coord_mode: string = 'REAL';
    vehicles: any[] = [];
    vehicle_types: any[] = [];
    addresses: any[] = [];
    items: any[] = [];
    services?: any[] = [];
    shipments?: any[] = [];
    solutions?: any[] = [];
    validation?: any;
    username?: string[];

    constructor(
        initial: any = undefined,
    ) {
        if (initial) {
            const jsonStr = JSON.stringify(initial).replace(/time_window"/g, `time_windows"`);
            Object.assign(this, JSON.parse(jsonStr));
            // let jsonStr = JSON.stringify(initial).replace(/time_window"/g, `time_windows"`);
            // Object.assign(this, initial);
        }
    }

    static toDate(s: string | Date): Date {
        return (s instanceof Date) ? s : new Date(s);
    }

    static toDateString2(s: string | Date): string {
        return format(Problem.toDate(s), 'MM/DD/YY HH:mm');
    }

    static toDateStringHHmm(s: string | Date): string {
        return format(Problem.toDate(s), 'HH:mm');
    }

    static createNewAddress(values = undefined): any {
        return Object.assign({ id: 'Loc_', name: '', full_address: '', postal: '', lon: 0, lat: 0 }, values);
    }

    static createNewShipment(values): any {
        return Object.assign({
            id: 'A', name: '',
            pickup_address: Problem.createNewAddress(),
            pickup_duration: 0,
            pickup_time_windows: [{ start: 0, end: 1000000 }],
            delivery_address: Problem.createNewAddress(),
            delivery_time_windows: [{ start: 0, end: 1000000 }],
            delivery_duration: 0,
            size: [],
        }, values);
    }

    static createNewService(values): any {
        return Object.assign({
            id: 'A', name: '', service_duration: 0,
            address: Problem.createNewAddress(),
            type: 'delivery', time_windows: [{ start: 0, end: 1000000 }], size: [],
        }, values);
    }

    static createNewVehicle(values): any {
        return Object.assign({
            id: '0', 'type_id': 'A',
            start_address: Problem.createNewAddress(),
            end_address: Problem.createNewAddress(),
            return_to_depot: true,
            earliest_start: 0,
            latest_end: 1000000,
        }, values);
    }

    static createNewVehicleType(values): any {
        return Object.assign({
            id: 'A',
            capacity: [100],
            fixed_costs: 0.0,
            distance_dependent_costs: 1.0,
            time_dependent_costs: 0.0,
        }, values);
    }

    _get(type: 'vehicles' | 'vehicle_types' | 'services' | 'shipments' | 'addresses', id: string) {
        if (this[type]) {
            return this[type].find((d) => d.id === id);
        } else {
            return undefined;
        }
    }

    getVehicle(id) {
        return _find(this.vehicles, { id: id });
    }

    getItem(id) {
        return _find(this.items, { id: id });
    }

    getJob(id: string) {
        const s = _find(this.services, { id: id });
        return s ? s : _find(this.shipments, { id: id });
    }

    getService(id: string) {
        return _find(this.services, { id: id });
    }

    getShipment(id) {
        return _find(this.shipments, { id: id });
    }

    getAddress(id) {
        return _find(this.addresses, { id: id });
    }

    getAddressNameFromId(addressId): string {
        const address = this.getAddress(addressId);
        if (address) {
            const startAddressName = _get(address, 'name');
            return startAddressName ? startAddressName : address.id;
        } else {
            return undefined;
        }
    }

    getAddressIds(): string[] {
        return this.addresses.map((a) => a.id);
    }

    getAddressNames() {
        return this.addresses.map((a) => a.name);
    }

    getActAddress(act) {
        if (act.type === 'depart' || act.type === 'return') {
            return this.getAddress(act.address.id);
        } else {
            let s = this.getService(act.job_id);
            if (s) {
                return this.getAddress(s.address.id);
            } else {
                s = this.getShipment(act.job_id);
                if (s) {
                    if (act.type.indexOf('pickup') >= 0) {
                        return this.getAddress(s.pickup_address.id);
                    } else {
                        return this.getAddress(s.delivery_address.id);
                    }
                } else {
                    return undefined;
                    // throw new Error('act.@job_id ' + act.job_id + ' not found');
                }
            }
        }
    }

    getActServiceDuration(act: any): number {
        if (act.type === 'depart' || act.type === 'return') {
            return 0;
        } else {
            let job = this.getService(act.job_id);
            if (job) {
                return parseFloat(job.service_duration);
            } else {
                job = this.getShipment(act.job_id);
                return parseFloat(_get(job, act.type + '_duration'));
            }
        }
    }

    getActTimeWindow(act, vehicleId) {
        if (act.type === 'depart' || act.type === 'return') {
            const v = this.getVehicle(vehicleId);
            return { start: v.earliest_start, end: v.latest_end };
        } else {
            let job = this.getService(act.job_id);
            if (job) {
                return _get(job, 'time_window');
            } else {
                job = this.getShipment(act.job_id);
                return _get(job, act.type + '_time_window');
            }
        }
    }

    getTotalNumberOfOrders(): number {
        return _size(this.shipments) + _size(this.services);
    }

    getReturnToDepotAct(route: any) {
        let returnAct: any = _find(route.act, { type: 'return' });
        if (returnAct) {
            return returnAct;
        } else {
            const v = this.getVehicle(route.vehicle_id);
            if (_get(v, 'return_to_depot')) {
                const endAddressId = _get(v, 'end_address.id');
                if (endAddressId) {
                    const lastAct: any = _last(route.act);
                    returnAct = { type: 'return', last_distance: route.distance - lastAct.distance, arr_time: route.end_time, end_time: route.end_time };
                    return returnAct;
                }
            }
            return undefined;
        }
    }

    getTimeWindow(act) {
        let s = this.getService(act.job_id);
        if (s) {
            return s.time_windows;
        } else {
            s = this.getShipment(act.job_id);
            if (s) {
                if (act.type.indexOf('pickup') >= 0) {
                    return s.pickup_time_windows;
                } else {
                    return s.delivery_time_windows;
                }
            } else { return ''; }
        }
    }

    /**
     * Scan pickup and delivery addresses of shipments & services, automatically create addresses missing in addresses field
     */
    readFromAddresses() {
        const self = this;
        function _addAddress(s, key: string) {
            if (!_isEmpty(s) && s[key] && s[key].id) {
                const id: string = s[key].id;
                const a = self.addresses.find((m) => m.id === id);
                if (a) {
                    s[key] = a;
                    if (['address', 'delivery_address'].includes(key) && a.vehicle_restriction) {
                        s.allowed_vehicles = a.vehicle_restriction;
                    }
                } else { // if not found
                    if (VrpUtils.isValidSingaporePostal(id) && !s[key].postal) {
                        s[key].postal = id;
                    }
                    self.addresses.push(s[key]);
                }
            }
        }

        this.vehicles.forEach((s) => {
            _addAddress(s, 'start_address');
            _addAddress(s, 'end_address');
        });

        this.shipments.forEach((s) => {
            _addAddress(s, 'pickup_address');
            _addAddress(s, 'delivery_address');
        });

        this.services.forEach((s) => {
            _addAddress(s, 'address');
        });
    }

    /**
     * Scan pickup and delivery addresses of shipments, automatically create addresses missing in addresses field
     */
    getValidationStatus() {
        const v = this.validation;

        if (this.coord_mode === '2D') {
            return 'Valid';
        }

        if (!v) {
            return 'Model not yet validated';
        }

        if (v.n_invalid_shipments === 0 && v.n_invalid_services === 0 && v.n_invalid_vehicles === 0) {
            return 'Valid';
        } else {
            let msgText = 'There are ';
            if (v.n_invalid_vehicles > 0) {
                msgText += ' ' + v.n_invalid_vehicles + ' invalid vehicles,';
            }

            if (v.n_invalid_services > 0) {
                msgText += ' ' + v.n_invalid_services + ' invalid services,';
            }

            if (v.n_invalid_shipments > 0) {
                msgText += ' ' + v.n_invalid_shipments + ' invalid shipments';
            }

            return msgText;
        }
    }

    exportRouteToCSV(route, includeHeader: boolean) {
        function _getDate(t) {
            return t ? (_isNumber(t)) ? Problem.toDateString2(new Date(t * 1000)) : Problem.toDateString2(t) : '';
        }
        const self = this;
        const vehicle = self.getVehicle(route.vehicle_id);
        const csvData = [];
        if (includeHeader) {
            const sizeLabels = self.items.map((item) => `${item.id} (${item.description})`);
            csvData.push(['Vehicle Id', 'Job Id', 'Type', 'Arrival Time', 'Leave Time', 'Distance (km)', 'Free Time (min)', 'Priority', 'LocationId', 'Time Windows'].concat(sizeLabels));
        }

        if (!vehicle) {
            alert('Vehicle ' + route.vehicle_id + ' not found');
            return undefined;
        }
        try {
            const startAddress = self.getAddress(vehicle.start_address.id) || vehicle.start_address;
            console.log('exportRouteToCSV -> startAddress', startAddress, vehicle);
            csvData.push([vehicle.id, undefined, 'Depart', undefined, _getDate(route.start_time),
                0, undefined, undefined, startAddress.full_address || startAddress.postal || startAddress.id, _getDate(vehicle.earliest_start), , ,
            ]);

            route.act.forEach((act: any, actIndex) => {
                const s = self.getJob(act.job_id);
                let tw = self.getTimeWindow(act);
                tw = Array.isArray(tw) ? tw : [tw];
                const twStr = tw.map((t) => `[${_getDate(t.start)},${_getDate(t.end)}]`).join(';');

                let last_distance = act.last_distance;
                if (actIndex === route.act.length - 1 && vehicle.return_to_depot) {
                    last_distance = route.distance - act.distance;
                }

                const address = self.getActAddress(act);
                const addressStr = address ? (address.full_address || address.postal || address.id) : '';

                const sizeValues = self.items.map((item, i) => _get(s, `size[${i}]`));

                csvData.push([vehicle.id, act.job_id, act.type,
                _getDate(act.arr_time),
                _getDate(act.end_time),
                (last_distance / 1000).toFixed(1),
                (act.waiting_time / 60).toFixed(1),
                _get(s, 'priority'),
                    addressStr,
                    twStr, ...sizeValues]);
            });

            if (vehicle.return_to_depot) {
                csvData.push([vehicle.id, undefined, 'Return', _getDate(route.end_time), undefined, undefined, undefined, undefined, self.getAddressNameFromId(vehicle.end_address.id), undefined, _getDate(vehicle.latest_end)]);
            }

            return csvData;
        } catch (err) {
            console.error(err);
        }
    }

    exportAllRoutesToCSV(routes) {
        const self = this;
        let csvData = [];
        routes.forEach((route, routeIndex) => {
            const tmp = self.exportRouteToCSV(route, routeIndex === 0);
            csvData = csvData.concat(tmp);
        });
        return csvData;
    }

    exportSolSummaryToCSV(sol: any) {
        function _getDate(t) {
            return t ? (_isNumber(t)) ? Problem.toDateString2(new Date(t * 1000)) : Problem.toDateString2(t) : '';
        }
        const self = this;
        const csvData = [['Solution Id', sol.id],
        ['Total Cost ($)', sol.costs.toFixed(1)],
        ['Total Distance (km)', (sol.distance / 1000).toFixed(1)],
        ['Total Time (hours)', sol.time / 3600],
        ['Total Transport Time (hours)', sol.transport_time !== null ? (sol.transport_time / 3600).toFixed(1) : 'unknown'],
        ['Total Service Time (hours)', sol.service_time !== null ? (sol.service_time / 3600).toFixed(1) : 'unknown'],
        ['Total Free Time (hours)', sol.waiting_time !== null ? (sol.waiting_time / 3600).toFixed(1) : 'unknown'],
        ['Number of routes', sol.no_routes],
        ['Number of deliveries', _get(sol, 'no_deliveries', 'unknown')],
        ['Number of pickups', _get(sol, 'no_pickups', 'unknown')],
        ['Number of unassigned jobs', _get(sol, 'no_unassigned_jobs', 0)],
        ["Unassigned jobs' IDs", (sol.unassigned_jobs || []).join('; ')],
        ['Number of ignored jobs', sol.no_ignored_jobs || 0],
        ["Ignored jobs' IDs", sol.ignored_jobs && (sol.ignored_jobs).join('; ')],
        [], [],
        ];
        sol.routes.forEach((route, routeIndex) => {
            if (routeIndex === 0) {
                const maxLoadLabels = self.items.map((item) => `Max ${item.id} (${item.description})`);
                csvData.push(['Vehicle Id', 'Vehicle Type', 'Distance (km)', 'Start', 'End', 'Fix Cost', 'Variable Cost', ...maxLoadLabels]);
            }
            const v = this.getVehicle(route.vehicle_id);
            const maxLoadValues = self.items.map((item, i) => _get(route, `max_load[${i}]`));
            csvData.push([route.vehicle_id, v && v.type_id, route.distance / 1000, _getDate(route.start_time), _getDate(route.end_time),
            route.fixed_costs, route.variable_costs, ...maxLoadValues]);
        });
        return csvData;
    }

    // evaluateRoute = function (route, sol, _mapService) {
    //     console.log('evaluateRoute', route);
    //     let self = this;

    //     let v = self.getVehicle(route.vehicle_id);
    //     console.log('vehicle', v);

    //     // add depart and return action if not specified
    //     let newActs = _(route.act).tap(function (array: any) {
    //         let firstAct: any = first(array);
    //         let lastAct: any =_last(array);
    //         if (firstAct.type !== 'depart') {
    //             array.unshift({ type: 'depart', address: self.getAddress(v.start_address.id), distance: 0, last_distance: 0, transport_time: 0 });
    //         }

    //         if (lastAct.type !== 'return') {
    //             if (self._parseBoolean(get(v, 'return_to_depot'))) {
    //                 let endAddressId = _get(v, 'end_address.id');
    //                 if (endAddressId) {
    //                     array.push({ type: 'return', address: self.getAddress(v.end_address.id), operation_time: 0 });
    //                 }
    //             }
    //         }
    //     }).value();

    //     let earliestStartTimes = [];
    //     let coordinates = [];
    //     let serviceDurations = [];

    //     newActs.forEach((act) => {
    //         let a = self.getActAddress(act);
    //         coordinates.push([a.lat, a.lon]); // add addresss
    //         serviceDurations.push(self.getActServiceDuration(act));
    //         let tw = self.getActTimeWindow(act, route.vehicle_id);
    //         let startTime = Number.isFinite(tw.start) ? tw.start : Problem.toDate(tw.start).getTime() / 1000;
    //         earliestStartTimes.push(startTime);
    //     });

    //     _mapService.getOSMRoute(coordinates).subscribe(function (result) {
    //         let legs = result.legs;

    //         newActs[0].arr_time = newActs[0].end_time = Math.max(earliestStartTimes[0], earliestStartTimes[1] - legs[0].duration);

    //         for (let i = 1; i < legs.length; i++) {
    //             newActs[i].arr_time = newActs[i - 1].end_time + legs[i - 1].duration;
    //             newActs[i].end_time = Math.max(newActs[i].arr_time, earliestStartTimes[i]) + serviceDurations[i];
    //             newActs[i].last_distance = legs[i - 1].distance;
    //             newActs[i].distance = newActs[i - 1].distance + legs[i - 1].distance;
    //             newActs[i].transport_time = legs[i - 1].duration;
    //             newActs[i].waiting_time = Math.max(earliestStartTimes[i] - newActs[i].arr_time, 0);
    //         }

    //         console.debug('log', newActs);
    //         newActs.forEach((act) => {
    //             act.arr_time = (new Date(act.arr_time * 1000)).toISOString();
    //             act.end_time = (new Date(act.end_time * 1000)).toISOString();
    //         });

    //         console.debug('log', newActs);
    //     }, function (err) {
    //         console.error('Error', err);
    //     });
    // };

    // private _parseBoolean(value) {
    //     if (typeof value === 'boolean') {
    //         return value;
    //     } else if (typeof value === 'string') {
    //         return /true/i.test(value);
    //     }
    //     return false;
    // }

}
