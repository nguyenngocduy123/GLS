/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { FormControl, FormGroup } from '@angular/forms';

export class PasswordValidator {
    static areEqual(formGroup: FormGroup) {
        let val;
        let valid = true;

        for (const key in formGroup.controls) {
            if (formGroup.controls.hasOwnProperty(key)) {
                const control: FormControl = <FormControl> formGroup.controls[key];

                if (val === undefined) {
                    val = control.value;
                } else {
                    if (val !== control.value) {
                        valid = false;
                        break;
                    }
                }
            }
        }

        if (valid === true) {
            return undefined;
        }

        return {
            areEqual: true,
        };
    }
}
