import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'm2km' })
export class VrpM2kmPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        return (value / 1000).toFixed(1) + ' km';
    }
}

@Pipe({ name: 'truncate' })
export class VrpTruncatePipe implements PipeTransform {
    transform(value: string, limit = 25, completeWords = false, ellipsis = '...') {
        if (value.length > limit) { // truncate only if value too small
            if (completeWords) {
                limit = value.substr(0, limit).lastIndexOf(' ');
            }
            return `${value.substr(0, limit)}${ellipsis}`;
        } else {
            return value;
        }
    }
}
