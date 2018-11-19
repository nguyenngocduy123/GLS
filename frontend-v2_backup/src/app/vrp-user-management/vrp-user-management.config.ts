export const USER_MANAGEMENT_SIDENAVLIST: any[] = [
    { label: 'All Active Users', icon: 'account_circle', filter: { disabled: false } },
    { label: 'Administrators', icon: 'verified_user', filter: { role: 'admin', disabled: false } },
    { label: 'Planners', icon: 'supervisor_account', filter: { role: 'planner', disabled: false } },
    { label: 'Drivers', icon: 'directions_car', filter: { role: 'driver', disabled: false } },
    { label: 'Disabled User', icon: 'do_not_disturb', filter: { disabled: true } },
];

export const USER_MANAGEMENT_TABLE_CONFIG: any[] = [
    { name: 'username', label: 'Username' },
    { name: 'fullname', label: 'Full Name' },
    { name: 'role', label: 'Role', width: 80 },
    { name: 'email', label: 'Email' },
    { name: 'usergroup', label: 'Usergroup', type: 'text' },
    { name: 'modified_date', label: 'Modified', type: 'timeAgo', width: 150 },
    { name: 'isOnline', label: 'Online', type: 'boolean', width: 80 },
    // { name: 'disabled', label: 'Disabled', type: 'boolean', width: 80 },
    { name: '_itemActions', label: '', width: 80 },
];

export const USER_GROUP_MANAGEMENT_TABLE_CONFIG: any[] = [
    { name: 'usergroup', label: 'Usergroup' },
    { name: 'description', label: 'Description' },
    { name: 'modified_date', label: 'Modified', type: 'timeAgo', width: 150 },
    { name: '_itemActions', label: '', width: 80 },
];

export const THEME_LIST: any[] = [
    { label: 'default', value: 'default' },
    { label: 'blue-orange', value: 'blue-orange' },
    { label: 'white-orange', value: 'white-orange' },
    { label: 'dark-grey-blue', value: 'dark-grey-blue' },
    { label: 'light-blue-red', value: 'light-blue-red' },
];

export const GEOCODING_SERVICE_LIST: any[] = [
    { label: 'OneMap', value: 'onemap' },
    { label: 'Baidu Map', value: 'bdmap' },
    { label: 'Google Map', value: 'gmap' },
];
