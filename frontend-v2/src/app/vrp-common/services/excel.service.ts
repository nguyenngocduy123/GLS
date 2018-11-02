import { Injectable } from '@angular/core';
import { read, utils, WorkBook, write } from 'xlsx';
import { get as _get, set as _set } from 'lodash-es';

import { VrpFileService } from './file.service';

@Injectable({ providedIn: 'root' })
export class VrpExcelService {

    constructor(
        private _file: VrpFileService,
    ) { }

    jsonToSingleSheetExcelFile(data: any[], mappingConfig: any[], sheetName: string, fileName: string) {
        const _data: any = {};
        const _config: any = {};
        _data[sheetName] = data;
        _config[sheetName] = mappingConfig;
        this.jsonToExcelFile(_data, _config, fileName);
    }

    jsonToExcelFile(data: any, mappingConfig: any, fileName: string) {
        const wb = this._jsonToWorkbook(data, mappingConfig);
        const blobData = this._workbookToBlobData(wb);
        const blob = new Blob([blobData], { type: 'application/octet-stream' });
        this._file.saveBlobAs(blob, fileName);
    }

    addCSVToWorkbook(wb: WorkBook = undefined, sheetData, sheetName, sheetColWidths: number[] = undefined) {
        const book = wb || { Sheets: {}, SheetNames: [] };
        const sheet = utils.aoa_to_sheet(sheetData);
        if (sheetColWidths) {
            sheet['!cols'] = sheetColWidths.map((w) => ({ wch: w }));
        }

        book.Sheets[sheetName] = sheet;
        book.SheetNames.push(sheetName);

        return book;
    }

    saveWorkbookToFile(wb, fileName: string = 'untitled.xlsx') {
        const blob: Blob = new Blob([this._workbookToBlobData(wb)], { type: 'application/octet-stream' });
        this._file.saveBlobAs(blob, fileName);
    }

    workbookToJson(blob, configs): any {
        const book = read(blob, { type: 'binary' });
        const answer = {};
        Object.keys(configs).forEach((sheetName) => {
            const sheet = book.Sheets[sheetName];
            if (sheet) {
                const config = configs[sheetName];
                const sheetData = utils.sheet_to_json(sheet, { raw: false });
                if (sheetData) {
                    const convertedObjects = this._sheetDataToJson(sheetData, config);
                    answer[sheetName] = convertedObjects;
                }

            }
        });

        return answer;
    }

    private _jsonToWorkbook(data: any, mappingConfig: any): WorkBook {
        let wb: WorkBook = {
            SheetNames: [],
            Sheets: {},
        };

        Object.keys(mappingConfig).forEach((key) => {
            const sheetData = data[key].filter((d) => d && Object.keys(d).length > 0);
            const sheetName = key;
            const sheetColWidths = mappingConfig[key].map((c) => c.widthExcel || 20);
            wb = this.addCSVToWorkbook(wb, this._jsonToSheetData(sheetData, mappingConfig[key]), sheetName, sheetColWidths);
        });
        return wb;
    }

    private _workbookToBlobData(wb: WorkBook) {
        const wbout = write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary', cellDates: true });
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i !== s.length; ++i) {
                /* tslint:disable:no-bitwise */
                // bitwise codes must be fixed with extra care
                view[i] = s.charCodeAt(i) & 0xFF;
            }
            return buf;
        }

        return s2ab(wbout);
    }

    private _sheetDataToJson(sheetData, config): any[] {
        const data = sheetData.map((rowData) => {
            const row: any = {};
            config.forEach((c, rowIndex) => {
                if (!c.hiddenExcel) {
                    const d = _get(rowData, c.name) || rowData[c.label];
                    _set(row, c.name, this._parser(d, c));
                }
            });
            return row;
        });

        return data;
    }

    private _jsonToSheetData(data, config) {
        const sheet: any[] = [];
        const header: any[] = [];

        const colWidths: number[] = [];

        config.forEach((c) => {
            if (!c.hiddenExcel) {
                const v: string = c.title || c.data || c.label || c.name;
                header.push(v);
                colWidths.push(v.length);
            }
        });
        sheet.push(header);

        data.forEach((rowData) => {
            const row = [];
            config.forEach((c, rowIndex) => {
                if (!c.hiddenExcel) {
                    const cellData = this._formatter(_get(rowData, c.name || c.data), c);
                    if (typeof cellData === 'string') {
                        colWidths[rowIndex] = Math.max(colWidths[rowIndex], cellData.length);
                    }
                    row.push(cellData);
                }
            });
            sheet.push(row);
        });

        sheet['!cols'] = colWidths.map((w) => ({ wch: w }));
        console.log('sheet[\'!cols\']', sheet['!cols']);

        return sheet;
    }

    private _parser(cellData, config): any {
        if (config.parse && cellData) {
            return config.parse(cellData, config);
        } else {
            return cellData;
        }
    }

    private _formatter(cellData, config): any {
        if (cellData) {
            if (config.formatExcel) {
                return config.formatExcel(cellData, config);
            } else if (config.format) {
                return config.format(cellData, config);
            }
        }

        return cellData;
    }
}
