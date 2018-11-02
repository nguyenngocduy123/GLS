import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'vrp-timewindows-input',
    templateUrl: './vrp-timewindows-input.component.html',
    styleUrls: ['./vrp-timewindows-input.component.scss'],
})
export class VrpTimewindowsInputComponent {

    _tws: any[] = [];

    @Input() label: string = 'Time Windows';
    @Input() disabled: boolean = false;
    @Input() timeSlots: any[] = [
        { label: '(00h - 24h) Day & Night ', start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
        { label: '(08h - 18h) Day Only    ', start: { hour: 8, minute: 0 }, end: { hour: 23, minute: 59 } },
        { label: '(08h - 12h) Morning', start: { hour: 8, minute: 0 }, end: { hour: 12, minute: 0 } },
        { label: '(12h - 18h) Afternoon', start: { hour: 12, minute: 0 }, end: { hour: 18, minute: 0 } },
        { label: '(18h - 20h) Evening ', start: { hour: 18, minute: 0 }, end: { hour: 20, minute: 0 } },
    ];

    @Input() set timeWindows(timeWindows) {
        if (timeWindows instanceof Array) {
            this._tws = timeWindows.map((tw) => ({ start: new Date(tw.start), end: new Date(tw.end) }));
        } else if (timeWindows) {
            this._tws = [{ start: new Date(timeWindows.start), end: new Date(timeWindows.end) }];
        }
        console.log('set - timeWindows', this._tws);
    }

    @Output() timeWindowsChange: EventEmitter<any[]>;

    constructor() {
        this.timeWindows = [];
        this.timeWindowsChange = new EventEmitter();
    }

    setTimeSlot(tw, ts) {
        tw.start = new Date(tw.start);
        tw.start.setHours(ts.start.hour, ts.start.minute);

        tw.end = new Date(tw.end);
        tw.end.setHours(ts.end.hour, ts.end.minute);

        this.onTimeWindowsChange();
    }

    insertTimeWindow() {
        this._tws.push({ start: new Date(), end: new Date() });
    }

    private onTimeWindowsChange(): void {
        this.timeWindowsChange.emit(this._tws);
    }
}
