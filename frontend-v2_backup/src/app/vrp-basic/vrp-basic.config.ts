import { configTransform } from '@app/vrp-common';

export const PROBLEM_PROPERTIES_CONFIG: any[] = [
    { name: 'name', label: 'Name', type: 'text', default: 'Unknown' },
    { name: 'fleet_size', label: 'Fleet Size', type: 'select', selections: ['FINITE', 'INFINITE'], default: 'FINITE', selectionLabels: ['Finite', 'Infinite'] },
    { name: 'coord_mode', label: 'Coordinates Mode', type: 'select', selections: ['REAL', '2D'], default: 'REAL' },
    // { name: "username", label: "Owners", type: "select", selections: ["admin", "xdel"] }
];

export const PROBLEMDETAIL_NAVLIST_CONFIG: any[] = [
    { name: 'vehicles', label: 'Vehicles', 'icon': 'local_shipping' },
    { name: 'vehicle_types', label: 'Vehicle Types', 'icon': 'removed_circle' },
    { name: 'services', label: 'Services', 'icon': 'call_made' },
    { name: 'shipments', label: 'Shipments', 'icon': 'import_export' },
    { name: 'items', label: 'Items', 'icon': 'list' },
    { name: 'addresses', label: 'Addresses', 'icon': 'list' },
];

export const DASHBOARD_TABLE_CONFIG: any[] = [
    { name: '_id', label: 'Id', width: 250 },
    { name: 'name', label: 'Name' },
    { name: 'modified_date', label: 'Updated', type: 'timeAgo', width: 180 },
    { name: 'fleet_size', label: 'Fleet Size', type: 'text', width: 150 },
    // { name: 'coord_mode', label: 'Coordinates Mode', width: 120 },
    { name: 'no_of_orders', label: 'No.Orders', type: 'number', width: 120 },
    { name: 'no_of_solutions', label: 'No.Solutions', type: 'number', width: 120 },
    { name: '_itemActions', label: '', width: 80, hiddenExcel: true },
];

export const PROBLEMDETAIL_TABLE_CONFIG: any = configTransform({
    'vehicles': [
        { name: 'id', label: 'ID', type: 'text', rowIndex: 0 },
        { name: 'type_id', label: 'Type', type: 'select', 'source_data_id': 'vehicle_types', width: 120, rowIndex: 0 },
        { name: 'max_num_job', label: 'Maximum Allowed Orders', type: 'number', hidden: true, rowIndex: 0 },
        { name: 'earliest_start', label: 'Start Time', type: 'dateTime', rowIndex: 1 },
        { name: 'latest_end', label: 'End Time', type: 'dateTime', rowIndex: 1 },
        { name: 'break_duration', label: 'Break Duration (m)', type: 'number', scale: 1.0 / 60, hidden: true, rowIndex: 1 },
        { name: 'break_time_windows', label: 'Break Timewindow', type: 'timeWindow', hidden: true, rowIndex: 1 },
        { name: 'start_address', label: 'Start Address', type: 'address', width: { min: 100, max: 400 }, rowIndex: 3 },
        { name: 'end_address', label: 'End Address', type: 'address', width: { min: 100, max: 400 }, rowIndex: 3 },
        { name: 'return_to_depot', label: 'Return', type: 'boolean', width: 80, rowIndex: 3 },
        // { name: 'same_loc_service_time', label: 'Same Loc Srv Time', type: 'number', scale: 60, rowIndex: 1 },
        // { name: '_itemActions', label: '', width: 80, hiddenExcel: true },
    ],
    'vehicle_types': [
        { name: 'id', label: 'ID', type: 'text', width: 120 },
        { name: 'capacity', label: 'Capacity', type: 'capacity', 'source_data_id': 'items' },
        { name: 'fixed_costs', label: 'Fixed Cost ($/trip)', type: 'number', rowIndex: 1 },
        { name: 'time_dependent_costs', label: 'Travel Time Cost ($/h)', type: 'number', scale: 3600, fraction: 3, rowIndex: 1 },
        { name: 'waiting_time_dependent_costs', label: 'Waiting Time Cost ($/h)', type: 'number', scale: 3600, fraction: 3, rowIndex: 1 },
        { name: 'distance_dependent_costs', label: 'Distance Cost ($/km)', type: 'number', scale: 1000, fraction: 3, rowIndex: 2 },
        // { name: 'shanghai_cost_params', label: 'Shanghai Cost Params', type: 'json' },
        { name: 'perKmFrom20_30', label: 'Distance Cost 20-29km', type: 'number', scale: 1000, rowIndex: 2, hidden: true },
        { name: 'perKmFrom30_50', label: 'Distance Cost 30-49km', type: 'number', scale: 1000, rowIndex: 2, hidden: true },
        { name: 'perKmFrom50_80', label: 'Distance Cost  50-80km', type: 'number', scale: 1000, rowIndex: 3, hidden: true },
        { name: 'perKmAbove_80', label: 'Distance Cost Above 80km', type: 'number', scale: 1000, rowIndex: 3, hidden: true },
        { name: 'perDropFrom3_5', label: 'Drop Cost 3-5point', type: 'number', rowIndex: 3, hidden: true },
        { name: 'perDropAbove5', label: 'Drop Cost  Above 5point', type: 'number', rowIndex: 3, hidden: true },
    ],
    'services': [
        { name: 'id', label: 'ID', type: 'text', width: { min: 100, max: 200 } },
        { name: 'name', label: 'Name', type: 'text', width: { min: 100, max: 400 }, },
        { name: 'size', label: 'Demand', type: 'size', 'source_data_id': 'items' },
        { name: 'type', label: 'Type', type: 'select', selections: ['pickup', 'delivery'], selectionLabels: ['Pickup', 'Delivery'] },
        { name: 'address', label: 'Address', type: 'address' },
        { name: 'service_setup_duration', label: 'Setup Duration (m)', type: 'number', fraction: 1, scale: 1.0 / 60, hidden: true },
        { name: 'service_duration', label: 'Duration (m)', type: 'number', fraction: 1, scale: 1.0 / 60 },
        { name: 'time_windows', label: 'Timewindow', type: 'timeWindow', rowIndex: 1 },
        { name: 'allowed_vehicles', label: 'Restriction', type: 'array', hidden: true },
        { name: 'same_vehicle_tag', label: 'SameVehicle', type: 'text', width: 120, rowIndex: 3, hidden: true },
        { name: 'priority', label: 'Priority', type: 'number' },
    ],
    'shipments': [
        { name: 'id', label: 'ID', type: 'text', width: { min: 200, max: 300 } },
        { name: 'name', label: 'Name', type: 'text', width: { min: 200, max: 300 } },
        { name: 'size', label: 'Demand', type: 'size', 'source_data_id': 'items', width: 120 },
        { name: 'pickup_address', label: 'P-Address', type: 'address', width: { min: 200, max: 300 }, rowIndex: 1 },
        { name: 'pickup_waiting_duration', label: 'P-Waiting (m)', type: 'number', scale: 1.0 / 60, fraction: 1, width: 140, rowIndex: 1, hidden: true },
        { name: 'pickup_loading_duration', label: 'P-Loading (m)', type: 'number', scale: 1.0 / 60, fraction: 1, width: 140, rowIndex: 1, hidden: true },
        { name: 'pickup_duration', label: 'P-Duration (m)', type: 'number', scale: 1.0 / 60, width: 140, rowIndex: 1, hidden: true },
        { name: 'pickup_time_windows', label: 'P-Timewindow', type: 'timeWindow', width: 140, rowIndex: 1 },

        { name: 'delivery_address', label: 'D-Address', type: 'address', width: { min: 200, max: 300 }, rowIndex: 2 },
        { name: 'delivery_waiting_duration', label: 'D-Waiting (m)', type: 'number', scale: 1.0 / 60, fraction: 1, width: 140, rowIndex: 2, hidden: true },
        { name: 'delivery_loading_duration', label: 'D-Loading (m)', type: 'number', scale: 1.0 / 60, fraction: 1, width: 140, rowIndex: 2, hidden: true },
        { name: 'delivery_duration', label: 'D-Duration (m)', type: 'number', scale: 1.0 / 60, width: 140, rowIndex: 2, hidden: true },
        { name: 'delivery_time_windows', label: 'D-Timewindow', type: 'timeWindow', width: 140, rowIndex: 2 },
        { name: 'allowed_vehicles', label: 'Restriction', type: 'array', width: 120, rowIndex: 3, hidden: true },
        { name: 'same_vehicle_tag', label: 'SameVehicleTag', type: 'text', width: 120, rowIndex: 3, hidden: true },
        { name: 'priority', label: 'Priority', type: 'number', width: 80, rowIndex: 3 },
    ],
    'items': [
        { name: 'id', label: 'ID', type: 'text' },
        { name: 'weight', label: 'Weight', type: 'number' },
        { name: 'description', label: 'Description', type: 'text' },
    ],
    'addresses': [
        { name: 'id', label: 'ID', type: 'text' },
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'postal', label: 'Postal Code', type: 'text' },
        { name: 'full_address', label: 'Full Address', type: 'text' },
        { name: 'lon', label: 'Longitude (X)', type: 'number', fraction: 6 },
        { name: 'lat', label: 'Latitude (Y)', type: 'number', fraction: 6 },
        { name: 'vehicle_restriction', label: 'Vehicle Restriction', type: 'text' },
    ],
});

export const ORDER_SELECTION_CONFIG: any[] = configTransform([
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'name', label: 'Customer', type: 'text', },
    { name: 'type', label: 'Type', type: 'text' }, // , valueLabels: ['Pickup', 'Delivery', 'Shipment', 'Service'] },
    { name: 'dueTime', label: 'Due Time', type: 'dateTime' }, // , valueLabels: ['Pickup', 'Delivery', 'Shipment', 'Service'] },
]);

export const OPTIMIZATION_CONFIG: any[] = [
    { name: 'solutionId', label: 'Solution Id', type: 'text', },
    { name: 'engine', label: 'Algorithm', type: 'select', selectionLabels: ['Memetic Algorithm', 'Hybrid Improvement'], selections: ['siwei', 'chinh'], default: 'chinh' },
    { name: 'costModel', label: 'Cost Model', type: 'select', selectionLabels: ['Default', 'Shanghai'], selections: ['default', 'shanghai'], default: 'default' },
    { name: 'nThreads', label: 'No. CPUs', type: 'number', default: 4, min: 1, max: 16 },
    { name: 'maxIterations', label: 'Max. Iteration', type: 'number', default: 500, min: 1, rowIndex: 1 },
    { name: 'minJobPenalty', label: '*Min. Job Penalty', type: 'number', default: 0.3, min: 0, rowIndex: 1 },
    { name: 'maxRunningTime', label: 'Max. Time (minutes)', type: 'number', default: 5, min: 1, rowIndex: 1 },
    { name: 'enableMinJobPenalty', label: '*Enable assignment balancing (min job)', type: 'checkbox', default: false, rowIndex: 6 }, // just a way to indicate whether to handle minJobPenalty
    { name: 'sortByVehicleId', label: '*Sort solution by vehicle id', type: 'checkbox', default: false, rowIndex: 6, hideForDynamic: true },
    // constraints
    { name: 'capacity', label: 'Maximum Capacity Constraint', type: 'checkbox', default: true, rowIndex: 2, isConstraint: true },
    { name: 'timeWindow', label: 'Time-Window Constraint', type: 'checkbox', default: true, rowIndex: 2, isConstraint: true },
    { name: 'vehicleBreak', label: 'Vehicle Break Constraint', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
    { name: 'restrictJobsToSpecificVehicles', label: 'Restrict jobs to specific vehicles', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
    { name: 'priorityJob', label: 'Prioritize Jobs Constraint', type: 'checkbox', default: true, rowIndex: 4, isConstraint: true },
    { name: 'completedBeforeDueTime', label: 'Complete jobs before due time', type: 'checkbox', default: false, rowIndex: 4, isConstraint: true },
    { name: 'sameVehicle', label: '*Same Vehicle Constraint', type: 'checkbox', default: false, rowIndex: 5, isConstraint: true },
    { name: 'maxNumJob', label: '*Limit number of jobs per vehicle', type: 'checkbox', default: false, rowIndex: 5, isConstraint: false },
    // { name: 'consolidation', label: 'Consolidate jobs', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
];

export const MAPSERVICE_SELECTION_CONFIG: any[] = [
    {
        name: 'service', label: 'Map Service', default: 'bdmap', type: 'select', selections: ['onemap', 'bdmap'],
        selectionLabels: ['OneMap', 'Baidu Map'],
    },
];

export const OPTIMIZATION_ENGINES: any = {
    CHINH_ENGINE: 'chinh',
    SIWEI_ENGINE: 'siwei',
};
