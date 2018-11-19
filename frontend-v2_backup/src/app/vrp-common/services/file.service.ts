import { Injectable } from '@angular/core';

import * as FileSaver from 'file-saver';

@Injectable({ providedIn: 'root'})
export class VrpFileService {

    constructor() { }

    open(options, callback) {
        console.log('VrpFileService - open', options);
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.multiple = false;
        options = options || {};

        if (options.accept) {
            fileInput.accept = options.accept;
        }

        fileInput.addEventListener('change', () => {
            const f = fileInput.files[0];
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const content = e.target.result;
                callback(content, f.name);
            };

            if (options.type === 'text') {
                reader.readAsText(f);
            } else if (options.type === 'binary') {
                reader.readAsBinaryString(f);
            } else {
                callback(f, f.name);
            }
        }, false);

        fileInput.click();
    }

    saveBlobAs(blob, fileName: string = 'untitled') {
        if (blob) {
            FileSaver.saveAs(blob, fileName);
        } else {
            console.error('Blob is undefined');
        }
    }

    saveAsJson(p: any, fileName: string) {
        const blob = new Blob([JSON.stringify(p, undefined, 4)], { type: 'text/json' });
        this.saveBlobAs(blob, fileName);
    }

    saveAsCSV(data, fileName: string) {
        console.log('saveAsCSV', data);
        this.saveBlobAs(new Blob([data], { type: 'text/csv;charset=utf-8;' }), fileName);
    }
}
