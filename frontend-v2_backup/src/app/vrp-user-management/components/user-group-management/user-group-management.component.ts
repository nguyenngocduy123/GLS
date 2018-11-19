import { Component, OnInit, Injectable, HostListener } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, ActivatedRoute } from '@angular/router';
import { TdLoadingService } from '@covalent/core/loading';
import { VrpDialogService } from '@components/vrp-dialog';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

import { VrpUserGroupRestService } from '@app/vrp-common';
import { VrpToastService } from '@app/vrp-common/services/planner-toast.service';
import { configTransform, configTranslate } from '@app/vrp-common/classes/vrp-configuration';
import { USER_GROUP_MANAGEMENT_TABLE_CONFIG } from '@app/vrp-user-management/vrp-user-management.config';

interface IVrpUserGroup {
    usergroup: string;
    description: string;
}

@Injectable()
export class VrpAllUserGroupsResolve implements Resolve<IVrpUserGroup[]> {

    constructor(
        private _userGroupRest: VrpUserGroupRestService,
    ) { }

    resolve(route: ActivatedRouteSnapshot) {
        return this._userGroupRest.getAllUserGroups();
    }
}

@Component({
    selector: 'vrp-user-group-management',
    templateUrl: './user-group-management.component.html',
    styleUrls: ['./user-group-management.component.scss'],
})
export class VrpUserGroupManagementComponent implements OnInit {

    usergroups: IVrpUserGroup[] = [];
    tableHeight: number = 500;

    readonly columns: any[] = configTranslate(configTransform(USER_GROUP_MANAGEMENT_TABLE_CONFIG), this._translate);

    tableActions: any[] = configTranslate([
        { tooltip: 'Create New User Group', icon: 'add', click: () => { this._create(); } },
    ], this._translate);

    selectActions: any[] = configTranslate([
        { tooltip: 'Delete', icon: 'delete', click: (usergroups) => this._delete(usergroups) },
    ], this._translate);

    constructor(
        private _route: ActivatedRoute,
        private _loading: TdLoadingService,
        private _dialog: VrpDialogService,
        private _userGroupRest: VrpUserGroupRestService,
        private _translate: TranslateService,
        private _toast: VrpToastService,
    ) {
        this.usergroups = this._route.snapshot.data['allUserGroups'];
    }

    @HostListener('window:resize', ['$event'])
    onResize(event = undefined) {
        this.tableHeight = window.innerHeight - 105;
    }

    ngOnInit(): void {
        this.onResize();
    }

    load(forceRefresh: boolean = false) {
        this._loading.register('vrp-user--group-management.load');
        this._userGroupRest.getAllUserGroups(forceRefresh).pipe(finalize(() => {
            this._loading.resolve('vrp-user-management.load');
        })).subscribe(
            (res) => {
                this.usergroups = res;
            },
            (err) => this._dialog.errorResponse(err),
        );
    }

    private _create() {
        this._dialog.openDynamicEdit([
            { name: 'usergroup', label: 'Usergroup', type: 'text' },
            { name: 'description', label: 'Description', type: 'text' },
        ]).subscribe((newUserGroup) => {
            this._userGroupRest.createUserGroups(newUserGroup).subscribe(
                (answer) => {
                    console.log('VrpUserGroupManagementComponent -> private_createUserGroup -> answer', answer);
                    if (answer) {
                        this.usergroups = [...answer, ...this.usergroups];
                        console.log('TCL: VrpUserGroupManagementComponent -> private_create -> this.usergroups', this.usergroups);
                    }
                    this._toast.shortAlert('Created successfully');
                },
                (err) => this._toast.shortAlert('Fail to create', err),
            );
        });
    }

    private _delete(usergroups: IVrpUserGroup[]) {
        this._dialog.confirm('Are you sure to delete selected usergroups?').subscribe((yes) => {
            if (yes) {
                this._loading.register('vrp-user-group-management.load');
                this._userGroupRest.deleteUserGroups(usergroups.map((u) => u.usergroup))
                    .pipe(finalize(() => this._loading.resolve('vrp-user-group-management.load')))
                    .subscribe(() => {
                        this.usergroups = this.usergroups.filter((u) => !usergroups.includes(u));
                    }, (err) => this._dialog.errorResponse(err));
            }
        });
    }

    // filterUsers(): void {
    // 	// console.log('VrpUserManagementComponent -> filterUsers -> this.users', this.users);
    // 	this.filteredUserGroups = this.userGroups.filter((res: IVrpUserGroup) => {
    // 		let answer: boolean = true;

    // 		return answer.res.includes();
    // 	});
    // }
}
