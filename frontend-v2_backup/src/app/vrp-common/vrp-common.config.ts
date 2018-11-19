export const USER_DROPDOWN_MENU: any = {
    admin: [
        { label: 'Dashboard', icon: 'dashboard', href: '#/cvrp/dashboard', },
        { label: 'Settings', icon: 'settings', href: '#/settings' },
        { label: 'Users', icon: 'people', href: '#/user-management', },
        { label: 'User Groups', icon: 'people', href: '#/user-management/usergroup', },
    ],
    default: [
        { label: 'Dashboard', icon: 'dashboard', href: '#/cvrp/dashboard' },
        { label: 'Settings', icon: 'settings', href: '#/settings' },
    ],
    planner: [
        { label: 'Plan', icon: 'satellite', href: `#/planner/plan?viewDate=${(new Date()).toISODate()}` },
        { label: 'Monitor', icon: 'dashboard', href: `#/planner/monitor/progress?viewDate=${(new Date()).toISODate()}` },
        { label: 'Transaction Log', icon: 'assessments', href: '#/planner/transaction' },
        { label: 'Data Management', icon: 'folder_open', href: '#/planner/data-management?tableName=DeliveryDetail' },
        { label: 'Message Box', icon: 'email', href: `#/planner/message-box?viewDate=${(new Date()).toISODate()}` },
        { label: 'Settings', icon: 'settings', href: '#/settings' },
    ],
    restricted_planner: [
        { label: 'Plan', icon: 'satellite', href: `#/planner/plan?viewDate=${(new Date()).toISODate()}` },
        { label: 'Monitor', icon: 'dashboard', href: `#/planner/monitor/progress?viewDate=${(new Date()).toISODate()}` },
        { label: 'Transaction Log', icon: 'assessments', href: '#/planner/transaction' },
        { label: 'Data Management', icon: 'folder_open', href: '#/planner/data-management?tableName=DeliveryDetail' },
        { label: 'Message Box', icon: 'email', href: `#/planner/message-box?viewDate=${(new Date()).toISODate()}` },
        { label: 'Settings', icon: 'settings', href: '#/settings' },
    ],
};

export const IDLE_TIMEOUT_DURATION: number = 15 * 60; // 15 minutes idle

export const PASSWORD_REGEX_PATTERN: RegExp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/; // Minimum eight characters, at least one uppercase letter, one lowercase letter and one number
export const EMAIL_REGEX_PATTERN: RegExp = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$/;
export const USERNAME_REGEX_PATTERN: RegExp = /^[a-zA-Z0-9_]+$/;
export const NRIC_REGEX_PATTERN: RegExp = /^[STFG]\d{7}[A-Z]$/;
export const PHONE_REGEX_PATTERN: RegExp = /^[0-9]{8}$/;

export const POSTAL_REGEX_PATTERN: RegExp = /^[0-9]{6}$/;

export const ID_REGEX_PATTERN: RegExp = /^[A-Za-z0-9-_ ]+$/;

export const USER_ROLE_OPTIONS: any[] = [
    { value: 'admin', label: 'Admin' },
    { value: 'default', label: 'Normal' },
    { value: 'planner', label: 'Planner' },
    { value: 'driver', label: 'Driver' },
];

export const USER_ENVIRONMENT: any = {
    THEME: { key: 'theme', defaultValue: 'default' },
    PRIMARY_GEOCODING_SERVICE: { key: 'primaryGeocodingService', defaultValue: 'onemap' },
    DATA_TOAST_NOTIFICATION: { key: 'dataToastNotification', defaultValue: false },
    JOB_BELL_NOTIFICATION: { key: 'jobBellNotification', defaultValue: false },
    MSG_TOAST_NOTIFICATION: { key: 'msgToastNotification', defaultValue: true },
    MSG_BELL_NOTIFICATION: { key: 'msgBellNotification', defaultValue: true },
};
