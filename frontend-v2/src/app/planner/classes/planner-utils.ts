import { FINISHED_JOB_STATUS } from '@app/planner/planner.config';
import { SqlTableNames } from '@app/planner/services/planner-rest.service';
import * as endOfDay from 'date-fns/end_of_day';
import * as isSameDay from 'date-fns/is_same_day';
import * as isWithinRange from 'date-fns/is_within_range';
import * as startOfDay from 'date-fns/start_of_day';
import { get as _get } from 'lodash-es';
import { remove as _remove } from 'lodash-es';

export class PlannerUtils {

    static updateItemsToArray(updatedItems: any[], targetArray: any[]) {
        const affectedItems = [];
        updatedItems.forEach((i) => {
            if (i) {
                const item = targetArray.find((t) => t.Id === i.Id);
                if (item) {
                    Object.assign(item, i);
                    affectedItems.push(item);
                } else { // if not, created,
                    targetArray.push(i);
                    affectedItems.push(i);
                }
            }
        });
        return affectedItems;
    }

    static removeItemsFromArray(removedItemIds: string[], targetArray: any[]): any[] {
        const removedItems = _remove(targetArray, (t) => removedItemIds.includes(t.Id));
        return removedItems;
    }

    static updateCreateAndRemoveAccordingToWS(ws: { data: any[], purpose: string }, targetArray: any[], tableName: SqlTableNames, queryObject: any): any[] {
        let affectedItems: any[] = [];
        if (['update', 'create', 'attempted'].includes(ws.purpose)) {
            affectedItems = PlannerUtils.updateItemsToArray(ws.data, targetArray);
            if (ws.data.length === 1 && tableName === 'DeliveryDetail') {
                if (!this.isWithinDateRange(ws.data[0].EndTimeWindow, queryObject.startDate, queryObject.endDate)) {
                    affectedItems = PlannerUtils.removeItemsFromArray(ws.data.map((d) => d.Id), targetArray);
                }
            }
        } else if (ws.purpose === 'delete') {
            affectedItems = PlannerUtils.removeItemsFromArray(ws.data, targetArray);
        }

        return affectedItems;
    }

    static containFinishedJob(jobs: any[]): boolean {
        return !jobs.every((d) => !PlannerUtils.isJobFinished(d));
    }

    static getFinishedJobs(jobs: any[]): any[] {
        return jobs.filter((d) => PlannerUtils.isJobFinished(d)).map((j) => j.DeliveryMasterId + ' - ' + j.JobType);
    }

    static isJobFinished(job: any): boolean {
        return FINISHED_JOB_STATUS.includes(job.Status);
    }

    static isJobDelivery(job: any): boolean {
        return job.JobType.toUpperCase() === 'DELIVERY';
    }

    static isJobPickup(job: any): boolean {
        return job.JobType.toUpperCase() === 'PICKUP';
    }

    static isLatLngInSingapore(lat: number, lng: number): boolean {
        if (lat && lng) {
            return (1.206622 < lat && lat < 1.481204) && (103.580887 < lng && lng < 104.053299);  // is in Singapore?
        } else {
            return false;
        }
    }

    static isSameUserGroup(a, b): boolean {
        if (!a.UserGroup && !b.UserGroup) {
            return true;
        } else if (a.UserGroup && b.UserGroup) {
            return a.UserGroup.toUpperCase() === b.UserGroup.toUpperCase();
        } else {
            return false;
        }
    }

    static isFilterPassed(o, filter): boolean {
        return Object.keys(filter).every((prop) => {
            return Object.keys(filter[prop]).every((key, val) => {
                if (key === '$sameDay') {
                    return isSameDay(o[prop], val);
                } else {
                    return false;
                }
            });
        });
    }

    static isLatLngValid(lat: number, lng: number): boolean {
        return !isNaN(lat) && (-90 < lat) && (lat < 90)
            && !isNaN(lng) && (-180 < lng) && (lng < 180);
    }

    static filterArrayBySearchTerm(searchTerm: string, data: any[], keys: string[], ignoreCase: boolean = true): any[] {
        if (!searchTerm) {
            return data.map((m) => m);
        }

        if (data && data.length > 0 && searchTerm) {
            const term = ignoreCase ? searchTerm.toLowerCase() : searchTerm;
            console.log('term', term);
            return data.filter((m) => {
                const str: string = keys.map((k) => _get(m, k, '')).join(';');
                console.log('str', str);
                return (ignoreCase ? str.toLowerCase().search(searchTerm) : str.search(searchTerm)) !== -1;
            });
        } else { return []; }
    }

    static isWithinDateRange(day, startDate: any, endDate: any): boolean {
        return isWithinRange(day, startOfDay(startDate), endOfDay(endDate));
    }

}
