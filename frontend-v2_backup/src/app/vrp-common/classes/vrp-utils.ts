import { POSTAL_REGEX_PATTERN } from '@app/vrp-common/vrp-common.config';

export class VrpUtils {
    /**
     * Apply filter t  a datetime columm
     * @param data original data
     * @param columnName name of column
     * @param timeRange object{start:'hh:mm',end:'hh:mm'}
     */
    // static applyFilterToDateColumn(data: any[], columnName: string, timeRange: any): any[] {
    // 	timeRange.start.split(':');
    // 	let [startHour, startMinute] = timeRange.start.split(':').map((s) => parseInt(s));
    // 	let [endHour, endMinute] = timeRange.end.split(':').map((s) => parseInt(s));

    // 	let filteredData = data.filter((s) => {
    // 		if (!s[columnName]) {
    // 			return false;
    // 		}

    // 		let d:Date = new Date(s[columnName]);

    // 		if (startHour <= d.getHours() && d.getHours() <= endHour) {
    // 			if (startHour === d.getHours() && startMinute > d.getMinutes()) {
    // 				return false;
    // 			}

    // 			if (endHour === d.getHours() && endMinute > d.getMinutes()) {
    // 				return false;
    // 			}
    // 			return true;
    // 		}
    // 		return false;
    // 	});
    // 	return filteredData;
    // }
    static applyFilterToDateColumn(data: any[], columnName: string, timeRange: any): any[] {
        return data.filter((s) => VrpUtils.isTimeWithinRange(s[columnName], timeRange));
    }

    static isTimeWithinRange(d: any, timeRange: any): boolean {
        if (!d) {
            return false;
        }

        const sTime: String = new Date(d).HHmm(':');
        const isValidStartTime: boolean = (timeRange.start === '') || (timeRange.start <= sTime);

        if (isValidStartTime) {
            return (timeRange.end === '') || (timeRange.end >= sTime);
        } else {
            return false;
        }
    }

    static isTimeWindowWithinRange(m: any, timeFilter: { start: string, end: string }): boolean {
        return m && (VrpUtils.isTimeWithinRange(m.StartTimeWindow, timeFilter) && VrpUtils.isTimeWithinRange(m.EndTimeWindow, timeFilter));
    }

    static isValidSingaporePostal(s: string): boolean {
        return POSTAL_REGEX_PATTERN.test(s);
    }

    static isAddressValid(address): boolean {
        if (address) {
            return VrpUtils.isLattitudeValid(address.lat) && VrpUtils.isLongitudeValid(address.lon);
        }
        return false;
    }

    static isLattitudeValid(lat): boolean {
        if (lat) {
            const isWithinSingapore = (lat > 1.206622 && lat < 1.481204); // is in Singapore?
            const isWithinJakarta = (lat > -7.805105 && lat < -5.907808); // is in Jarkarta?
            const isWithinShanghai = (lat > 29.755791 && lat < 32.306632); // is in Shanghai?
            const isWithinKuching = (lat > -2 && lat < 2.5); // is in Kuching?
            return isWithinSingapore || isWithinJakarta || isWithinShanghai || isWithinKuching;
        } else {
            return false;
        }
    }

    static isLongitudeValid(lng): boolean {
        if (lng) {
            const isWithinSingapore = (lng > 103.580887 && lng < 104.053299); // is in Singapore?
            const isWithinJakarta = (lng > 106.411519 && lng < 108.738187); // is in Jarkarta?
            const isWithinShanghai = (lng > 119.229896 && lng < 122.927183); // is in Shanghai?
            const isWithinKuching = (lng > 108 && lng < 113); // is in Kuching?
            return isWithinSingapore || isWithinJakarta || isWithinShanghai || isWithinKuching;
        } else {
            return false;
        }

    }

}
