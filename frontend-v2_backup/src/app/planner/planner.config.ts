import { configTransform } from '@app/vrp-common';

export const STATUS_LABELS: string[] = [
    undefined, // 0
    'PENDING', 'LATE', 'ONTIME', 'UNSUCCESSFUL', 'EXPECTED LATE', 'UNASSIGNED', // 1,2,3,4,5,6
    undefined, undefined, undefined, // 7,8,9
    'PENDING', 'COMPLETED', 'UNASSIGNED', // 10,11,12
];

export const FINISHED_JOB_STATUS: number[] = [2, 3, 4];

export const PRIORITY_LABELS: string[] = ['', 'LOW', 'MEDIUM', 'HIGH']; // 0, 1, 2, 3

export const STATUS_COLORS: any[] = [
    { primary: '', secondary: '' },
    { primary: '#1e90ff', secondary: '#D1E8FF', color: 'blue', textColor: 'white' }, //   pending
    { primary: '#d77823', secondary: '#d77823', color: 'orange', textColor: 'white' }, //  late
    { primary: '#62f442', secondary: '#62f442', color: 'green', }, //  ontime
    { primary: '#ad2121', secondary: '#FAE3E3', color: 'red', textColor: 'white' }, //  unsuccessful
    { primary: '#b83dba', secondary: '#b83dba', color: 'magenta', textColor: 'white' }, // yellow, expected to be late
    // { primary: '#c5477f', secondary: '#c5477f', color: 'pink', textColor: 'white' }, pink, expected to be late
    { primary: '#585858', secondary: '#585858', color: 'grey', textColor: 'white' }, //  unassigned
];

export const WS_ROUTE_HEADERS: string[] = ['Vehicle Id', 'Job Sequence', 'Job Id', 'Job Type', 'Address', 'Contact Name', 'Start Time', 'End Time', 'Actual Delivery Time', 'Status'];

export const WS_ROUTE_COLUMN_WIDTHS: number[] = [10, 12, 8, 8, 30, 12, 12, 12, 17, 8];

export const PLANNING_VEHICLE_SELECTION_CONFIG = configTransform([
    { name: 'id', label: 'ID', type: 'text' },
    { name: 'type_id', label: 'Type', type: 'select', 'source_data_id': 'vehicle_types' },
    { name: 'driver_name', label: 'Driver Name', type: 'text' },
    { name: 'earliest_start', label: 'Start Time', type: 'dateTime' },
    { name: 'latest_end', label: 'End Time', type: 'dateTime' },
    { name: 'num_assigned', label: 'Number of Assigned Orders', type: 'number', hidden: true },
    { name: 'max_num_job', label: 'Maximum Allowed Orders', type: 'number', hidden: true },
    { name: 'start_address', label: 'Start Address', type: 'address', width: { min: 100, max: 400 }, rowIndex: 1, hidden: true },
    { name: 'end_address', label: 'End Address', type: 'address', width: { min: 100, max: 400 }, rowIndex: 1, hidden: true },
    { name: 'return_to_depot', label: 'Return', type: 'boolean', width: 80, rowIndex: 1, hidden: true },
]);

export const PLANNING_ORDER_SELECTION_CONFIG = configTransform([
    { name: 'id', label: 'Id', type: 'text' },
    { name: 'name', label: 'Customer', type: 'text', },
    { name: 'type', label: 'Type', type: 'text', toUpperCase: true },
    { name: 'dueTime', label: 'Due Time', type: 'dateTime', },
    { name: 'pickupDue', label: 'Pickup Due', type: 'dateTime' },
    { name: 'deliveryDue', label: 'Delivery Due', type: 'dateTime' },
    { name: 'priority', label: 'Priority', type: 'text', valueLabels: PRIORITY_LABELS },
    { name: 'status', label: 'Status', type: 'text', valueLabels: STATUS_LABELS },
]);

export const DISPATCH_JOB_SELECTION_CONFIG = configTransform([
    // { name: 'EngineRouteSeqNum', label: 'Seq.', type: 'text', width: { min: 10, max: 50 } },
    { name: 'Address', label: 'Address', type: 'text' },
    { name: 'Postal', label: 'Postal', type: 'text' },
    { name: 'StartTimeWindow', label: 'Start Time Window', type: 'dateTime' },
    { name: 'DeliveryMasterId', label: 'Order ID', type: 'text', width: { min: 200, max: 300 } },
    { name: 'JobType', label: 'Job Type', type: 'text' },
    { name: 'EndTimeWindow', label: 'Due Time', type: 'dateTime' },
    { name: 'Status', label: 'Status', type: 'text', valueLabels: STATUS_LABELS },
    { name: 'UserGroup', label: 'UserGroup', type: 'text' },
    { name: '_itemActions', label: '', width: 80, hiddenExcel: true },
]);

export const SQL_TABLE_CONFIG: any = configTransform({
    // for excel import only
    'Order': [
        { name: 'Id', label: 'OrderId', type: 'text', width: 300 },
        { name: 'CustomerName', label: 'CustomerName', type: 'text', hidden: true },
        { name: 'CustomerPhone', label: 'CustomerPhone', hidden: true },
        { name: 'CustomerEmail', label: 'CustomerEmail', type: 'text', hidden: true },
        { name: 'VehicleRestriction', label: 'VehicleRestriction', type: 'text', hidden: false, toUpperCase: true },
        { name: 'Priority', label: 'Priority', type: 'text', valueLabels: PRIORITY_LABELS, fraction: 0 },
        { name: 'JobType', label: 'JobType', widthExcel: 12, width: { min: 50, max: 100 }, toUpperCase: true },
        { name: 'Address', label: 'Address', type: 'text', widthExcel: 20, hidden: true },
        { name: 'Postal', label: 'Postal', type: 'text' },
        { name: 'Lat', label: 'Lat', type: 'number', fraction: 3, hidden: true },
        { name: 'Lng', label: 'Lng', type: 'number', fraction: 3, hidden: true },
        { name: 'StartTimeWindow', label: 'StartTimeWindow', type: 'dateTime', hidden: true },
        { name: 'EndTimeWindow', label: 'EndTimeWindow', type: 'dateTime', hidden: true },
        { name: 'ServiceTime', label: 'ServiceTime', type: 'number', hidden: true },
        { name: 'ContactName', label: 'ContactName', widthExcel: 16, width: { min: 100, max: 200 } },
        { name: 'ContactPhone', label: 'ContactPhone', type: 'text', hidden: false, widthExcel: 16, width: { min: 100, max: 100 } },
        { name: 'VerificationCode', label: 'VerificationCode', type: 'text' },
        { name: 'Note', label: 'Note', type: 'text', hidden: false, widthExcel: 16 },
        { name: 'UserGroup', label: 'UserGroup', type: 'text' },
    ],
    'DeliveryMaster': [
        { name: 'Id', label: 'OrderId' },
        { name: 'CustomerName', label: 'CustomerName' },
        { name: 'CustomerPhone', label: 'CustomerPhone' },
        { name: 'CustomerEmail', label: 'CustomerEmail', type: 'text' },
        { name: 'VehicleRestriction', label: 'VehicleRestriction', type: 'text' },
        { name: 'Priority', label: 'Priority', type: 'number', fraction: 0 },
    ],
    'DeliveryDetail': [
        { name: 'DeliveryMasterId', label: 'Order Id', widthExcel: 20, width: { min: 100, max: 200 } },
        { name: 'JobType', label: 'Job Type', widthExcel: 12, width: { min: 50, max: 100 } },
        { name: 'Address', label: 'Address', type: 'text', widthExcel: 20 },
        { name: 'Postal', label: 'Postal', type: 'text', hidden: true },
        { name: 'StartTimeWindow', label: 'StartTimeWindow', type: 'dateTime', hidden: true },
        { name: 'EndTimeWindow', label: 'EndTimeWindow', type: 'dateTime', hidden: true },
        { name: 'ServiceTime', label: 'ServiceTime', type: 'number', hidden: true },
        { name: 'Status', label: 'Job Status', type: 'text', valueLabels: STATUS_LABELS, widthExcel: 12, hidden: false },
        { name: 'ContactName', label: 'ContactName', widthExcel: 16, width: { min: 50, max: 200 } },
        { name: 'DeliveryMaster.CustomerName', label: 'CustomerName', type: 'text', hidden: true },
        { name: 'DeliveryMaster.CustomerPhone', label: 'CustomerPhone', hidden: true },
        { name: 'DeliveryMaster.CustomerEmail', label: 'CustomerEmail', type: 'text', hidden: true },
        { name: 'ContactPhone', label: 'ContactPhone', type: 'text', widthExcel: 16, width: { min: 50, max: 100 } },
        { name: 'Priority', label: 'Priority', type: 'text', valueLabels: PRIORITY_LABELS, widthExcel: 8, width: { min: 50, max: 100 } },
        { name: 'VerificationCode.Code', label: 'Verification Code', widthExcel: 16, width: { min: 50, max: 150 }, hidden: true },
        { name: 'VehicleRestriction', label: 'VehicleRestriction', type: 'text' },
        { name: 'VehicleId', label: 'AssignedTo', type: 'text', hidden: true },
        { name: 'UserGroup', label: 'UserGroup', type: 'text', hidden: true },
        { name: '_itemActions', label: '', width: 90, hiddenExcel: true },
    ],
    'DeliveryItem': [
        { name: 'DeliveryMasterId', label: 'OrderId' },
        { name: 'ItemId', label: 'ItemId' },
        { name: 'ItemQty', label: 'Quantity', type: 'number', fraction: 0 },
    ],
    'Item': [
        { name: 'Id', label: 'ItemId', type: 'text', widthExcel: 12 },
        { name: 'Weight', label: 'Weight', type: 'number', fraction: 3, widthExcel: 12 },
        { name: 'Description', label: 'Description', type: 'text', widthExcel: 16 },
        { name: '_itemActions', label: '', width: 80, hiddenExcel: true, sortable: false },
    ],
    'VehicleType': [
        { name: 'Name', label: 'Name', widthExcel: 8, type: 'text', toUpperCase: true },
        { name: 'Capacity', label: 'Capacity', widthExcel: 12, type: 'number' },
        { name: 'FixedCost', label: 'FixedCost', widthExcel: 14, type: 'number', fraction: 3 },
        { name: 'DistanceCost', label: 'DistanceCost', widthExcel: 20, type: 'number', fraction: 3 },
        { name: 'TravelTimeCost', label: 'TravelTimeCost', widthExcel: 20, type: 'number', fraction: 3 },
        { name: 'WaitingTimeCost', label: 'WaitingTimeCost', widthExcel: 20, type: 'number', fraction: 3 },
        { name: '_itemActions', label: '', width: 80, hiddenExcel: true },
    ],
    'Vehicle': [
        { name: 'Id', label: 'VehicleId', widthExcel: 16, type: 'text', toUpperCase: true },
        { name: 'VehicleType.Name', label: 'VehicleType', widthExcel: 12, type: 'text', toUpperCase: true },
        { name: 'DriverUsername', label: 'Driver', widthExcel: 14, type: 'text' },
        { name: 'PlateNumber', label: 'PlateNumber', widthExcel: 14, type: 'text', hidden: true },
        { name: 'StartAddressPostal', label: 'StartPostal', widthExcel: 10, rowIndex: 1, type: 'text', hidden: true },
        { name: 'EndAddressPostal', label: 'EndPostal', widthExcel: 10, rowIndex: 1, type: 'text', hidden: true },
        { name: 'StartTime', label: 'StartTime', widthExcel: 10, rowIndex: 2, type: 'time' },
        { name: 'EndTime', label: 'EndTime', widthExcel: 10, rowIndex: 2, type: 'time' },
        { name: 'ReturnToEndAddress', label: 'ReturnToDepot', widthExcel: 10, rowIndex: 2, type: 'boolean' },
        { name: 'MaxNumJobs', label: 'MaxNumJobs', widthExcel: 10, rowIndex: 1, type: 'number', hidden: true },
        { name: 'UserGroup', label: 'UserGroup', type: 'text' },
        { name: '_itemActions', label: '', width: 80, hiddenExcel: true },
    ],
});

export const PLAN_TABLE_CONFIG: any[] = configTransform([
    { name: 'VehicleId', label: 'Id', widthExcel: 16, type: 'text' },
    { name: 'DeliveryMasterId', label: 'OrderId' },
    { name: 'JobType', label: 'JobType', widthExcel: 12, width: { min: 50, max: 100 } },
    { name: 'arr_time', label: 'Arrival Time', type: 'text' },
    { name: 'end_time', label: 'Leave Time', type: 'text' },
    { name: 'distance', label: 'Distance (km)', type: 'text' },
    { name: 'waiting_time', label: 'Free Time (min)', type: 'text' },
    { name: 'Priority', label: 'Priority', type: 'text', valueLabels: PRIORITY_LABELS, },
    { name: 'Postal', label: 'LocationId', type: 'number', fraction: 0 },
    { name: 'StartTimeWindow', label: 'Ready Time', type: 'dateTime' },
    { name: 'EndTimeWindow', label: 'Due Time', type: 'dateTime' },
]);

export const TRANSACTION_LOG_TABLE_CONFIG: any[] = configTransform([
    { name: 'DeliveryMasterId', label: 'Order Id', widthExcel: 16 },
    { name: 'JobType', label: 'Job Type', widthExcel: 12 },
    { name: 'Status', label: 'Job Status', type: 'text', valueLabels: STATUS_LABELS, widthExcel: 12 },
    { name: 'ActualDeliveryTime', label: 'Delivery Time', type: 'dateTime', dateFormat: 'MM/DD/YY HH:mm', widthExcel: 25 },
    { name: 'ContactName', label: 'Customer Name', widthExcel: 20 },
    { name: 'DeliveryMaster.LastAttemptedByDriver', label: 'Attempted By', type: 'text', widthExcel: 20 },
    { name: 'DeliveryMaster.LastAttemptedByPlateNumber', label: "Driver's Plate Number", type: 'text', widthExcel: 20, width: { min: 200, max: 300 } },
    { name: '_itemActions', label: '', width: 90, hiddenExcel: true },
]);

export const PLANNER_OPTIMIZATION_CONFIG: any = [
    { name: 'solutionId', label: 'Solution Id', type: 'text', },
    { name: 'engine', label: 'Algorithm', type: 'select', selectionLabels: ['Memetic Algorithm', 'Hybrid Improvement'], selections: ['siwei', 'chinh'], default: 'chinh' },
    { name: 'costModel', label: 'Cost Model', type: 'select', selectionLabels: ['Default', 'Shanghai'], selections: ['default', 'shanghai'], default: 'default', readonly: true },
    { name: 'nThreads', label: 'No. CPUs', type: 'number', default: 4, min: 1, max: 8 },
    { name: 'maxIterations', label: 'Max. Iteration', type: 'number', default: 1000, min: 1, rowIndex: 1 },
    { name: 'minJobPenalty', label: '*Min. Job Penalty', type: 'number', default: 0.3, min: 0, rowIndex: 1 },
    { name: 'maxRunningTime', label: 'Max. Time (minutes)', type: 'number', default: 5, min: 1, rowIndex: 1 },
    { name: 'enableMinJobPenalty', label: '*Enable assignment balancing (min job)', type: 'checkbox', default: true, rowIndex: 5 }, // just a way to indicate whether to handle minJobPenalty
    { name: 'sortByVehicleId', label: '*Sort solution by vehicle id', type: 'checkbox', default: true, rowIndex: 5, hideForDynamic: true },
    // constraints
    { name: 'capacity', label: 'Maximum Capacity Constraint', type: 'checkbox', default: true, rowIndex: 2, isConstraint: true },
    { name: 'timeWindow', label: 'Time-Window Constraint', type: 'checkbox', default: true, rowIndex: 2, isConstraint: true },
    // { name: 'vehicleBreak', label: 'Vehicle Break Constraint', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
    { name: 'restrictJobsToSpecificVehicles', label: 'Restrict jobs to specific vehicles', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
    { name: 'priorityJob', label: 'Prioritize jobs', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
    { name: 'completedBeforeDueTime', label: 'Complete jobs before due time', type: 'checkbox', default: true, rowIndex: 4, isConstraint: true },
    // { name: 'sameVehicle', label: '*Same Vehicle Constraint', type: 'checkbox', default: false, rowIndex: 4, isConstraint: true },
    { name: 'maxNumJob', label: '*Limit number of jobs per vehicle', type: 'checkbox', default: true, rowIndex: 4, isConstraint: true },
    // { name: 'consolidation', label: 'Consolidate jobs', type: 'checkbox', default: true, rowIndex: 3, isConstraint: true },
];

export const PLATE_NUMBER_MAXLENGTH: number = 10;
export const PLATENUMBER_REGEX_PATTERN: RegExp = /^[A-Za-z0-9-]+$/;

export const DEFAULT_NEW_JOB = {
    ContactName: 'Test', ContactPhone: '12345678', ContactEmail: 'sample@gmail.com', Status: 1, VerificationCode: undefined,
    StartTimeWindow: (new Date()).setHours(8, 0, 0), EndTimeWindow: (new Date()).setHours(18, 0, 0), ServiceTime: 10,
    DeliveryItems: [],
};

export const DEFAULT_NEW_PICKUP_JOB = Object.assign({
    JobType: 'PICKUP', JobSequence: 1, Address: 'OneNorth MRT', Postal: '138647', Lat: 1.299854, Lng: 103.787437,
}, DEFAULT_NEW_JOB);

export const DEFAULT_NEW_DELIVERY_JOB = Object.assign({
    JobType: 'DELIVERY', JobSequence: 2, Address: 'Clementi MRT', Postal: '129580', Lat: 1.315676, Lng: 103.765009,
}, DEFAULT_NEW_JOB);

export const DEFAULT_NEW_ORDER = {
    CustomerName: 'Sample Customer', CustomerPhone: '12345678', CustomerEmail: 'sample@gmail.com',
    Priority: 2, VehicleRestriction: undefined,
    DeliveryDetails: [Object.assign({}, DEFAULT_NEW_PICKUP_JOB), Object.assign({}, DEFAULT_NEW_DELIVERY_JOB)],
};
