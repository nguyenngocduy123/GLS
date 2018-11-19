import { Pipe, PipeTransform } from '@angular/core';

import { STATUS_LABELS } from '@app/planner/planner.config';

@Pipe({ name: 'statusLabel' })
export class PlannerStatusLabelPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        return STATUS_LABELS[value] || (`Unknown Status ${value}`);
    }
}
