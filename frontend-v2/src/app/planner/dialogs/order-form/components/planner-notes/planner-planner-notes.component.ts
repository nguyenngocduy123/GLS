import { Component, Input, EventEmitter, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'vrp-planner-notes',
    templateUrl: './planner-planner-notes.component.html',
    styleUrls: ['./planner-planner-notes.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PlannerPlannerNotesComponent),
            multi: true,
        },
    ],
})
export class PlannerPlannerNotesComponent implements ControlValueAccessor {

    @Input() readonly: boolean = false;

    @Output() notesChange: EventEmitter<any> = new EventEmitter();
    newNote: any = { key: undefined, value: undefined };

    @Input() notesValue: any[];
    get notes(): any[] {
        return this.notesValue;
    }

    set notes(value: any[]) {
        this.notesValue = value;
        this.propagateChange(this.notesValue);
    }

    constructor() { }

    propagateChange = (_: any) => { };

    writeValue(val: any): void {
        this.notes = val;
    }

    registerOnChange(fn: any): void {
        this.propagateChange = fn;
    }

    registerOnTouched(fn: any): void {
    }

    addNote() {
        const note = Object.assign({}, this.newNote);
        if (this.notesValue) {
            this.notesValue.push(note);
        } else {
            this.notesValue = [note];
        }

        this.newNote = { key: undefined, value: undefined };
        // this.update();
    }

    removeNote(indx) {
        this.notesValue.splice(indx, 1);
        // this.update();
    }

    update() {
        this.propagateChange(this.notesValue);
    }
}
