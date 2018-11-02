export class ValidatorUtils {
    static setError(r: any, prop: string, errorMsg: string) {
        if (!r._error) {
            r._error = [];
        }
        r._error.push([prop, errorMsg]);
    }

    static setDuplicateError(r: any, prop: string) {
        ValidatorUtils.setError(r, prop, 'Duplicate');
    }

    static setAlreadyExistError(r: any, prop: string) {
        ValidatorUtils.setError(r, prop, 'Already Exist');
    }

    static setInExistError(r: any, prop: string) {
        ValidatorUtils.setError(r, prop, 'Does not Exist');
    }

    static setNonAlphaNumericError(r: any, prop: string) {
        ValidatorUtils.setError(r, prop, `Should be valid string`);
    }

    static setNonNegativeError(r: any, prop: string) {
        ValidatorUtils.setError(r, prop, `Should be non-negative`);
    }

    static setIncorrectDateError(r: any, prop: string): any {
        ValidatorUtils.setError(r, prop, `Invalid date`);
    }

    static isRowValid(r: any): boolean {
        return (!r._error || r._error.length === 0);
    }

    static isAlphaNumeric(value: any): boolean {
        return value && new RegExp(`^[a-zA-Z0-9_-]*$`).test(value);
    }

    static isNonNegativeNumber(value: any): boolean {
        return (Number.isFinite(value) && value >= 0);
    }

    static isNonNegativeIntegerNumber(value: any): boolean {
        return Number.isFinite(value) && Number.isInteger(value) && value >= 0;
    }

    static checkNonNegativeNumber(r: any, prop: string): boolean {
        const answer: boolean = ValidatorUtils.isNonNegativeNumber(r[prop]);
        if (!answer) {
            ValidatorUtils.setNonNegativeError(r, prop);
        }
        return answer;
    }

    static checkNonNegativeIntegerNumber(r: any, prop: string): boolean {
        const answer: boolean = ValidatorUtils.isNonNegativeIntegerNumber(r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, 'Should be non-negative integer');
        }
        return answer;
    }

    static checkAlphaNumeric(r: any, prop: string): boolean {
        const answer: boolean = ValidatorUtils.isAlphaNumeric(r[prop]);
        if (!answer) {
            ValidatorUtils.setNonAlphaNumericError(r, prop);
        }
        return answer;
    }

    static checkPostalCode(r: any, prop: string): boolean {
        const answer: boolean = r[prop] && new RegExp(`^[0-9]{6}$`).test('' + r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should contain 6 digits`);
        }
        return answer;
    }

    static checkTimeFormat(r: any, prop: string): boolean {
        const answer: boolean = r[prop] && new RegExp(`^([01][0-9]|2[0-3]):([0-5][0-9])$`).test('' + r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be in HH:mm format`);
        }
        return answer;
    }

    static checkJobType(r: any, prop: string): boolean {
        const answer: boolean = r[prop] && ['pickup', 'delivery'].includes(r[prop].toLowerCase());
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be 'Delivery' or 'Pickup'`);
        }
        return answer;
    }

    static checkPriority(r: any, prop: string): boolean {
        const answer: boolean = Number.isInteger(r[prop]) && r[prop] >= 1 && r[prop] <= 3;
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be HIGH, MEDIUM or LOW`);
        }
        return answer;
    }

    static checkVerificationCode(r: any, prop: string): boolean {
        const answer: boolean = r[prop] && new RegExp(`^[0-9]{5}$`).test('' + r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be 5 digits`);
        }
        return answer;
    }

    static checkPhoneNumber(r: any, prop: string): boolean {
        const answer: boolean = r[prop] && new RegExp(`^[0-9]{8}$`).test('' + r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be 8 digits`);
        }
        return answer;
    }

    static checkPlateNumber(r: any, prop: string): boolean {
        let answer: boolean = r[prop] && r[prop].length <= 10;
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should be less than 10 characters`);
        }
        answer = answer && new RegExp(`^[A-Za-z0-9-]+$`).test('' + r[prop]);
        if (!answer) {
            ValidatorUtils.setError(r, prop, `Should contain numbers, letters and dashes only`);
        }
        return answer;
    }
}
