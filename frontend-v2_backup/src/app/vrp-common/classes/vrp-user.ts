
export interface IVrpUser {
    username: string;
    role: 'default' | 'admin' | 'planner' | 'driver';
    nric?: string;
    disabled?: boolean;
    disabled_date?: Date;
    fullname?: string;
    email?: string;
    modified_date?: Date;
    isOnline?: boolean;
    note?: string;
    phone?: string;
    usergroup?: string;
}
