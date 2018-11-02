import { Injectable } from '@angular/core';
import { VrpCacheable } from '@app/vrp-common';
import { Problem } from '@app/vrp-basic/classes/problem';

@Injectable()
export class VrpBasicDataService {

    problem: VrpCacheable<Problem> = new VrpCacheable();
    constructor() { }
}
