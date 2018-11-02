import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarModule } from 'angular-calendar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule, } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CovalentLayoutModule } from '@covalent/core/layout';
import { CovalentLoadingModule } from '@covalent/core/loading';
import { CovalentMenuModule } from '@covalent/core/menu';
import { CovalentNotificationsModule } from '@covalent/core/notifications';
import { CovalentDataTableModule } from '@covalent/core/data-table';
import { CovalentCommonModule } from '@covalent/core/common';
import { CovalentSearchModule } from '@covalent/core/search';

const MaterialModules: any[] = [
    MatInputModule, MatExpansionModule, MatCardModule, MatListModule, MatIconModule, MatTooltipModule,
    MatButtonModule, MatMenuModule, MatSelectModule, MatPaginatorModule, MatCheckboxModule,
    MatSlideToggleModule, MatDialogModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatNativeDateModule, MatDatepickerModule, MatToolbarModule, MatStepperModule,
    MatTabsModule, MatSidenavModule, MatFormFieldModule, MatAutocompleteModule, MatGridListModule,
];

const CovalentModules: any[] = [
    CovalentLoadingModule, CovalentLayoutModule, CovalentMenuModule, CovalentNotificationsModule,
    CovalentSearchModule, CovalentDataTableModule, CovalentCommonModule,
];

@NgModule({
    exports: [
        // any other module that imports this module gets access to directives can bind to component properties
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,

        CalendarModule,

        ...MaterialModules,
        ...CovalentModules,
    ],
})
export class SharedModule { }
