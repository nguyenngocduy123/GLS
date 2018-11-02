import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'engineLabel' })
export class VrpBasicEngineLabelPipe implements PipeTransform {
    transform(value: any, args?: any): any {
        return value === 'chinh' ? 'HI' : 'MA';
    }
}
