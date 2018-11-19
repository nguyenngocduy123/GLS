
import { TdTimeAgoPipe } from '@covalent/core/common';
import * as format from 'date-fns/format';
import * as isValid from 'date-fns/is_valid';

import { TranslateService } from '@ngx-translate/core';

const _defaultExcelDateFormat: string = 'MM/DD/YY HH:mm';
const _defaultTableDateFormat: string = 'HH:mm';
const _timeAgoPipe = new TdTimeAgoPipe();

const _parseDate = (v) => {
    const d = new Date(v); // parse(v, _defaultExcelDateFormat);
    // console.log('_parseDate', v, d);
    return (isValid(d)) ? d : undefined;
};

const _transformer: any = {
    'array': {
        format: (v) => v, // ? v.join(';') : '',
        parse: (v) => v.replace('[', '').replace(']', '').split(';').map((t) => {
            const parsedValue = parseFloat(t);
            return (isNaN(parsedValue)) ? t : parsedValue;
        }),
    },
    'dateTime': {
        format: (v, config) => v ? format(v, config.dateFormat || _defaultTableDateFormat) : '',
        formatExcel: (v, config) => v ? format(v, _defaultExcelDateFormat) : '',
        parse: (v) => _parseDate(v),
    },
    'timeWindow': {
        format: (v, config): string => {
            if (!v) {
                return 'Undefined';
            }

            const dateFormat = _defaultTableDateFormat;
            const tw = Array.isArray(v) ? v : [v];
            return tw.map((t) => `[${format(t.start, dateFormat)},${format(t.end, dateFormat)}]`).join(';');
        },
        formatExcel: (v, config) => {
            const dateFormat = _defaultExcelDateFormat; // || config.dateFormat ;
            const tw = Array.isArray(v) ? v : [v];
            return tw.map((t) => `[${format(t.start, dateFormat)},${format(t.end, dateFormat)}]`).join(';');
        },
        parse: (v, config) => {
            const twStrs = v.split(';');
            return twStrs.map((s) => {
                const d = s.replace('[', '').replace(']', '').split(',');
                return { start: _parseDate(d[0]), end: _parseDate(d[1]) };
            });
        },
    },
    'address': {
        format: (v, config) => v ? (v.full_address || v.postal || v.id || `[${v.lat},${v.lon}]`) : '',
        formatExcel: (v, config) => v ? JSON.stringify(v) : '',
        parse: (v, config) => {
            // console.log('address parse', v, config.type);
            let address;
            try {
                address = JSON.parse(v);
                if (!address.id) {
                    address.id = address.postal || ((address.lat && address.lon) && `${address.lat.toFixed(3)}_${address.lon.toFixed(3)}`) || address.full_address;
                    if (address.id) {
                        address.id = address.id.trim();
                    }
                }
            } catch (err) {
                address = { id: v };
            }

            if (!address.postal && address.id && address.id.length === 6) {
                address.postal = address.id;
            }
            return address;
        },
    },
    'number': {
        format: (v, config) => {
            const n = (config && config.scale) ? (v * config.scale) : v;
            return (Number.isFinite(n) && parseFloat(n).toFixed(config.fraction || 0)) || '';
        },
        parse: (v, config) => parseFloat(v) / ((config && config.scale) ? config.scale : 1),
    },
    'boolean': {
        format: (v): string => v ? 'Yes' : 'No',
        formatExcel: (v) => v,
        parse: (v) => {
            if (v === undefined) {
                return false;
            } else if (typeof v === 'boolean') {
                return v;
            } else if (typeof v === 'string') {
                return /true/i.test(v);
            } else {
                return false;
            }
        },
    },
    'timeAgo': {
        format: (v: number | string | Date, config) => v ? _timeAgoPipe.transform(v, undefined) : '',
        formatExcel: (v, config) => v ? format(v, _defaultExcelDateFormat) : '',
    },
    'json': {
        format: (v, config) => v,
        formatExcel: (v, config) => v ? JSON.stringify(v) : '',
        parse: (v, config) => {
            try {
                const j = JSON.parse(v);
                console.log('json parse', j, v);
                return j;
            } catch (err) {
                console.log(v, err);
                return undefined;
            }
        },
    },
    'text': {
        format: (v, config) => {
            const value: string = config.valueLabels ? config.valueLabels[v] : v;
            return (value && typeof v === 'string' && config.toUpperCase) ? value.toUpperCase() : value;
        }, parse: (v, config) => {
            if (typeof v === 'string') {
                v = v.trim();
            }

            if (config.valueLabels && typeof v === 'string') {
                const i: number = config.valueLabels.indexOf(v.toUpperCase());
                return i > -1 ? i : v;
            }

            if (v && config.toUpperCase) {
                return v.toUpperCase();
            }
            return v;
        },
    },
};

export function configTranslate(configs: any, translator: TranslateService): any {
    if (Array.isArray(configs)) {
        return _translateLabel(configs, translator);
    } else {
        const answer: any = {};
        Object.keys(configs).forEach((key) => {
            answer[key] = _translateLabel(configs[key], translator);
        });
        return answer;
    }
}

function _translateLabel(configs: any[], translator: TranslateService): any[] {
    const _configs: any[] = configs.map((c) => c);
    _configs.forEach((c) => {
        if (c.label) {
            c.label = translator.instant(c.label);
        }

        if (c.selectionLabels) {
            c.selectionLabels = c.selectionLabels.map((t) => translator.instant(t));
        }

    });

    return _configs;
}

export function configTransform(configs: any): any {
    if (Array.isArray(configs)) {
        return _transformType(configs);
    } else {
        const answer: any = {};
        Object.keys(configs).forEach((key) => {
            answer[key] = _transformType(configs[key]);
        });
        return answer;
    }
}

function _transformType(configs: any[]): any[] {
    const _configs: any[] = configs.map((c) => c);
    _configs.forEach((c) => {
        if (c.type && (_transformer[c.type])) {
            if (_transformer[c.type].format) {
                c.format = (d) => _transformer[c.type].format(d, c);
            }

            if (_transformer[c.type].formatExcel) {
                c.formatExcel = _transformer[c.type].formatExcel;
            }

            if (_transformer[c.type].parse) {
                c.parse = _transformer[c.type].parse;
            }

            if (c.type === 'number') {
                c.numberic = true; // for TdDataTable visualize numbers
            }
        }

    });

    return _configs;
}
