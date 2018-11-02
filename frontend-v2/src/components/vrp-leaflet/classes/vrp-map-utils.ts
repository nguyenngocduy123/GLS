import { DivIcon, Icon } from 'leaflet';

let hueValue: number = 0.2;
const colorArray: string[] = [];

function _getNewColor(): string {
    hueValue += 222.5;
    return 'hsla(' + hueValue + ', 75%, 50%, 1)';
}

Icon.Default.imagePath = 'assets/images/markers/';
Icon.Default.mergeOptions({
    iconRetinaUrl: 'free-map-marker-icon-blue.png',
    iconUrl: 'free-map-marker-icon-blue.png',
    shadowUrl: 'free-map-marker-icon-grey.png',
});

export class VrpMapUtils {
    /**
     * Inspired by https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
     */
    static getRandomColor(index: number = -1): string {
        if (index < 0) {
            return _getNewColor();
        } else {
            if (index >= colorArray.length) {
                for (let i = 0; i < (index + 1 - colorArray.length); i++) {
                    colorArray.push(_getNewColor());
                }
            }
            return colorArray[index];
        }
    }

    static createStationMarkerIcon(color: string = 'black', size: number = 20) {
        const stationSvg = `<?xml version="1.0" encoding="iso-8859-1"?>
        <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 628.007 628.007" style="enable-background:new 0 0 628.007 628.007;" xml:space="preserve" >
                    <path style="fill:${color};" d="M314.008,44.738c84.404,0,153.059,68.704,153.059,153.108s-68.674,153.05-153.059,153.05
                        c-84.444,0-153.118-68.655-153.118-153.05S229.565,44.738,314.008,44.738 M314.008,0C204.729,0,116.162,88.557,116.162,197.836
                        c0,109.24,197.846,430.171,197.846,430.171s197.836-320.93,197.836-430.171C511.854,88.557,423.268,0,314.008,0z
                         M364.686,127.882c-10.669-9.614-27.532-14.997-50.492-14.997c-18.72,0-33.394,1.632-44.64,3.507v177.983h23.263v-72.182
                        c5.354,1.368,11.744,1.612,18.7,1.612c22.735,0,42.5-6.693,55.045-19.775c9.125-9.35,13.952-22.198,13.952-38.475
                        C380.484,149.503,374.3,136.411,364.686,127.882z M312.054,205.095c-7.758,0-14.186-0.557-19.257-1.876v-70.003
                        c4.025-1.084,11.744-1.895,21.905-1.895c25.393,0,42.5,11.49,42.5,35.554C357.212,191.202,340.104,205.095,312.054,205.095z"/>
        </svg>`;
        const iconUrl = 'data:image/svg+xml;base64,' + btoa(stationSvg);

        return new Icon({
            iconUrl: iconUrl,
            iconSize: [size, size],
            iconAnchor: [size / 2, size], popupAnchor: [0, -size],
        });
    }

    static createTruckMarkerIcon(color: string, size: number = 30) {
        const truckSvg = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 259.761 259.761" style="enable-background:new 0 0 259.761 259.761;" xml:space="preserve" fill="${color}">
<path d="M129.879,0C77.562,0,35,42.563,35,94.882c0,31.605,29.071,81.486,41.569,101.465c10.282,16.436,21.32,32.062,31.079,44
        c15.871,19.414,20.328,19.414,22.232,19.414c1.827,0,6.105,0,21.921-19.42c9.784-12.014,20.831-27.637,31.106-43.988
        c12.584-20.027,41.854-70.006,41.854-101.471C224.761,42.563,182.198,0,129.879,0z M129.88,171.525
        c-41.389,0-75.062-33.673-75.062-75.062c0-41.389,33.673-75.062,75.062-75.062c41.389,0,75.062,33.673,75.062,75.062
        C204.942,137.852,171.269,171.525,129.88,171.525z"/>
    <path d="M184.678,67.66c-0.52,0-1.054,0.075-1.586,0.222l-6.027,1.659l-6.257-15.244c-1.773-4.319-7.014-7.834-11.683-7.834
        h-58.573c-4.669,0-9.91,3.514-11.683,7.833l-6.25,15.225l-5.951-1.639c-0.532-0.146-1.066-0.222-1.586-0.222
        c-2.849,0-4.916,2.176-4.916,5.174v3.555c0,3.499,2.848,6.347,6.347,6.347h0.682l-1.01,2.459
        c-1.647,4.014-2.988,10.807-2.988,15.145v30.288c0,3.499,2.848,6.347,6.347,6.347h8.291c3.499,0,6.347-2.848,6.347-6.347v-7.563
        h71.316v7.563c0,3.499,2.848,6.347,6.347,6.347h8.288c3.499,0,6.347-2.848,6.347-6.347v-30.288c0-4.338-1.341-11.131-2.988-15.145
        l-1.01-2.459h0.767c3.499,0,6.347-2.848,6.347-6.347v-3.555C189.594,69.836,187.527,67.66,184.678,67.66z M87.17,79.288
        l9.467-23.062c1.06-2.584,4.213-4.697,7.006-4.697h52.392c2.792,0,5.944,2.114,7.005,4.697l9.467,23.062
        c1.061,2.584-0.357,4.697-3.149,4.697H90.32C87.528,83.985,86.11,81.872,87.17,79.288z M108.305,108.456
        c0,1.396-1.143,2.539-2.539,2.539H87.782c-1.397,0-2.539-1.143-2.539-2.539v-8.631c0-1.396,1.143-2.539,2.539-2.539h17.984
        c1.396,0,2.539,1.143,2.539,2.539V108.456z M174.263,108.456c0,1.396-1.143,2.539-2.539,2.539h-17.982
        c-1.396,0-2.539-1.143-2.539-2.539v-8.631c0-1.396,1.143-2.539,2.539-2.539h17.982c1.396,0,2.539,1.143,2.539,2.539V108.456z"/>
</svg>`; // 128x128 */
        const iconUrl = 'data:image/svg+xml;base64,' + btoa(truckSvg);

        return new Icon({
            iconUrl: iconUrl,
            iconSize: [size, size],
            iconAnchor: [size / 2, size], popupAnchor: [0, -size],
        });
    }

    static createSimpleCircleMarkerIcon(html: string = '', color: string = 'grey', size = 20): DivIcon {
        return new DivIcon({ className: `simple-marker-div  simple-marker-${color}`, iconSize: [size, size], html: html });
    }

    static createHtmlMarkerIcon(html: string = '', color: string = 'blue', size = 30): L.DivIcon {
        return new DivIcon({
            className: `blank-marker-icon ${color}`, iconSize: [size, size],
            iconAnchor: [size / 2, size], popupAnchor: [0, -size], html: html,
        });
    }
}
