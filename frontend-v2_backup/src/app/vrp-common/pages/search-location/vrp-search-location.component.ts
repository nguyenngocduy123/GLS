import { Component, ViewChild } from '@angular/core';
import { TdLoadingService } from '@covalent/core/loading';
import { finalize } from 'rxjs/operators';

import { VrpGeocodeService } from '@app/vrp-common';
import { VrpLeafletComponent, VrpMapUtils, VrpMarker } from '@components/vrp-leaflet';
import { VrpToastService } from '@app/vrp-common/services/toast.service';

@Component({
    selector: 'vrp-search-location',
    templateUrl: './vrp-search-location.component.html',
    styleUrls: ['./vrp-search-location.component.scss'],
})
export class VrpSearchLocationComponent {

    private _marker: VrpMarker;
    hasActivePostal: boolean = false; // indicates if postal code was retrieved from server

    @ViewChild('leafletMap') _map: VrpLeafletComponent;

    address: any;

    constructor(
        private _geocode: VrpGeocodeService,
        private _loading: TdLoadingService,
        private _toast: VrpToastService,
    ) { }

    geocode(postal: string) {
        if (postal && postal.length === 6) {
            this._loading.register('vrp-search-location.load');
            this._geocode.geocode([postal])
                .pipe(finalize(() => this._loading.resolve('vrp-search-location.load')))
                .subscribe(
                    (answer) => {
                        if (answer[0] && answer[0].lat && answer[0].lon) {
                            this.address = {
                                postal,
                                lat: Number(answer[0].lat).toFixed(6),
                                lng: (Number(answer[0].lon).toFixed(6) || Number(answer[0].lng).toFixed(6)),
                            };
                            this.locate();
                            this.hasActivePostal = true;
                        } else {
                            this.address = { postal };
                            this.clearInput();

                            this._toast.shortAlert(`Postal ${postal} is not found in database`);
                        }
                    },
                    (err) => this._toast.shortAlert(`Unable to connect to Map service`, err),
                );
        }
    }

    clearSearch() {
        this.address = undefined;
        this.hasActivePostal = false;
        this._hideMarker();
    }

    clearInput() {
        this.address.lat = 0;
        this.address.lng = 0;
        this.hasActivePostal = false;
        this._hideMarker();
    }

    isLatLngValid() {
        if (this.address) {
            if (-90 < this.address.lat && this.address.lat < 90 && -180 < this.address.lng && this.address.lng < 180) {
                return true;
            }
        }
        return false;
    }

    locate() {
        if (!this._marker) {
            this._marker = new VrpMarker(this.address);
            this._marker.normalIcon = (info = undefined) => VrpMapUtils.createHtmlMarkerIcon('', 'blue', 50);
            this._marker.setNormalIcon();
            this._map.add(this._marker);
            this._marker.bindTooltip('T', { permanent: true, direction: 'bottom', offset: [0, 10] });

        } else {
            this._marker.setLatLng(this.address);
        }
        this._marker.setTooltipContent(`<b>Coordinates</b>: ${this.address.lat}, ${this.address.lng}`);
        this._map.showLayers([this._marker]).fitBounds();
    }

    save() {
        this._geocode.createPostals([this.address]).subscribe(() => {
            this._toast.shortAlert(`Postal ${this.address.postal} has been saved to server`);
        }, (err) => this._toast.shortAlert(`Fail to save  ${this.address.postal} to server`, err));
    }

    removeActivePostal() {
        if (!this.address || !this.address.postal || !this.hasActivePostal) {
            return;
        }

        const postal = this.address.postal;
        this._geocode
            .removePostal(postal)
            .subscribe(
                () => {
                    this._toast.shortAlert(`Postal ${postal} has been removed from server`);
                    this.address.postal = postal;
                    this.clearInput();
                },
                (err) =>
                    this._toast.shortAlert(`Fail to remove ${postal} from server`, err),
            );
    }

    private _hideMarker() {
        if (this._marker) {
            this._map.hideLayers([this._marker]);
        }
    }

    // importPostalCodes() {
    // 	this._dialog.openFileDialog({ accept: '.xlsx,.xls', type: 'binary' }, (result) => {
    // 		let excelData = this._excel.workbookToJson(result, { postals: [{ name: 'postal' }, { name: 'lat' }, { name: 'lon' }] });
    // 		console.log('excelData', excelData);
    // 		if (excelData) {
    // 			this.addresses = excelData;
    // 			// this._geocode.createPostals(excelData).subscribe((res) => {
    // 			// 	this._dialog.openShortAlert(`Postals inserted successfully`);
    // 			// 	console.log(res);
    // 			// }, (err) => this._dialog.openerrorResponse(err));
    // 		}
    // 	});
    // }
}
