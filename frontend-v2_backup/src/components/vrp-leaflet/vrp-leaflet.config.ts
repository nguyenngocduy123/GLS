
export const HIGHLIGHT_PATH_OPTIONS: Object = { 'delay': 800, 'dashArray': [10, 20], 'weight': 6, pulseColor: '#FFFFFF', paused: false };

// for google darktheme tile layers
export const GOOGLE_DARKTHEME_STYLE: any[] = [{
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#212121',
        },
    ],
}, {
    'elementType': 'labels.icon',
    'stylers': [
        {
            'visibility': 'off',
        },
    ],
},
{
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#757575',
        },
    ],
},
{
    'elementType': 'labels.text.stroke',
    'stylers': [
        {
            'color': '#212121',
        },
    ],
},
{
    'featureType': 'administrative',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#757575',
        },
    ],
},
{
    'featureType': 'administrative.country',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#9e9e9e',
        },
    ],
},
{
    'featureType': 'administrative.land_parcel',
    'stylers': [
        {
            'visibility': 'off',
        },
    ],
},
{
    'featureType': 'administrative.locality',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#bdbdbd',
        },
    ],
},
{
    'featureType': 'poi',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#757575',
        },
    ],
},
{
    'featureType': 'poi.park',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#181818',
        },
    ],
},
{
    'featureType': 'poi.park',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#616161',
        },
    ],
},
{
    'featureType': 'poi.park',
    'elementType': 'labels.text.stroke',
    'stylers': [
        {
            'color': '#1b1b1b',
        },
    ],
},
{
    'featureType': 'road',
    'elementType': 'geometry.fill',
    'stylers': [
        {
            'color': '#2c2c2c',
        },
    ],
},
{
    'featureType': 'road',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#8a8a8a',
        },
    ],
},
{
    'featureType': 'road.arterial',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#373737',
        },
    ],
},
{
    'featureType': 'road.highway',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#3c3c3c',
        },
    ],
},
{
    'featureType': 'road.highway.controlled_access',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#4e4e4e',
        },
    ],
},
{
    'featureType': 'road.local',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#616161',
        },
    ],
},
{
    'featureType': 'transit',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#757575',
        },
    ],
},
{
    'featureType': 'water',
    'elementType': 'geometry',
    'stylers': [
        {
            'color': '#000000',
        },
    ],
},
{
    'featureType': 'water',
    'elementType': 'labels.text.fill',
    'stylers': [
        {
            'color': '#3d3d3d',
        },
    ],
},
];

export const BASE_LAYERS: any[] = [
    { name: 'Carto', isDefault: true, type: 'xyz', url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png' },
    { name: 'World Topo', type: 'xyz', url: '//server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: '' },
    { name: 'OSM', type: 'xyz', url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '' },
    // openStreetTopoMap: {name: "OSM Topo", type: "xyz", url: "//{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: ""},
    // bingRoad: { name: "Bing Road", type: "bing", key: "Ag-VuG4_547fADU8mPcCFb6tGKlnmWJ7WtKSI-Rsf8JsmL9lniQ0pCE11o7AvWQa", layerType: "Road" },
    // bingAerial: { name: "Bing Aerial", type: "bing", key: "Ag-VuG4_547fADU8mPcCFb6tGKlnmWJ7WtKSI-Rsf8JsmL9lniQ0pCE11o7AvWQa", layerType: "Aerial" },
    { name: 'MapBox', type: 'xyz', url: 'https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiY2hpbmhuZ3V5ZW5xdW9jIiwiYSI6ImNqNWF2Zzk4ZjBjYWUzM3FoNWlobWlocmsifQ.XjStyY4vzpIU0Oy4v8gaGw' },
    // { name: 'Google Terrain', layerType: 'terrain', type: 'google' },
    // { name: 'Google Hybrid', layerType: 'hybrid', type: 'google' },
    // { name: 'Google Streets', layerType: 'roadmap', type: 'google' },
    // { name: 'Google Streets Dark', layerType: 'roadmap', type: 'google', styles: GOOGLE_DARKTHEME_STYLE },
    // hereMap: {name: "Here Map", url: "http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/{type}/{mapID}/{scheme}/{z}/{x}/{y}/{size}/{format}?app_id={app_id}&app_code={app_code}&lg={language}", subdomains: "1234", base: "base", type: "xyz", scheme: "normal.day"},
    // noMap: { name: "No map", type: "xyz", url: "" }
];
