
import { Injectable } from '@angular/core';

import { VrpDialogService } from '@components/vrp-dialog';

@Injectable()
export class VrpBasicDialogService extends VrpDialogService {
    // openOptimizationSelection(data: IVrpOptimizationDialogData): Observable<any> {
    //     return this.openWithConfig(VrpOptimizationSettingsDialogComponent, {
    //         maxWidth: '100vw', maxHeight: '100vh', data,
    //     });
    // }
}
