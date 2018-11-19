import * as  isSameDay from 'date-fns/is_same_day';

import { PlannerUtils } from '@app/planner/classes/planner-utils';
import { FINISHED_JOB_STATUS } from '@app/planner/planner.config';

export interface IPlannerJobQuery {
    startDate: Date;
    endDate: Date;
    finishedJob: boolean;
}

export class PlannerJobQuery implements IPlannerJobQuery {
    startDate: Date;
    endDate: Date;
    finishedJob: boolean;

    constructor(
        intials: IPlannerJobQuery,
    ) {
        this.startDate = intials.startDate;
        this.endDate = intials.endDate;
        this.finishedJob = intials.finishedJob;
    }

    isSameWith(d: PlannerJobQuery): boolean {
        return (this.finishedJob === d.finishedJob) && // same status
            (!this.startDate && !d.startDate) && isSameDay(this.startDate, d.startDate) && // same start date
            (!this.endDate && !d.endDate) && isSameDay(this.endDate, d.endDate); // same end date
    }

    isJobSatisfyQuery(job: any): boolean {
        // console.debug('isJobSatisfyQuery', job, isWithinRange(job.EndTimeWindow, startOfDay(this.startDate), endOfDay( this.endDate));
        return (!this.finishedJob || PlannerUtils.isJobFinished(job)) &&
            PlannerUtils.isWithinDateRange(job.EndTimeWindow, this.startDate, this.endDate);
    }

    getStatusQuery() {
        return this.finishedJob ? { Status: FINISHED_JOB_STATUS } : undefined;
    }

    // to delete cached job which is moved out of selected date range
    isJobCached(job: any, cache: any[]): boolean {
        return (!this.finishedJob || PlannerUtils.isJobFinished(job)) &&
            cache.map((c) => c.DeliveryMasterId).includes(job.DeliveryMasterId);
    }
}
