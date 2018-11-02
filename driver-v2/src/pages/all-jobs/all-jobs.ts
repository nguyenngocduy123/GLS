/**
 * @license
 * Copyright Singapore Institute of Manufacturing Technology (SIMTech). All Rights Reserved.
 *
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

import { Component, ViewChild } from '@angular/core';
import { Checkbox, IonicPage, MenuController, NavController, FabContainer, Platform, Navbar } from 'ionic-angular';
import { remove as _remove } from 'lodash-es';

import { Globals, MenuName } from '../../globals';
import { JobStatus, Job } from '../../providers/classes/job';
import { UserDriverProvider } from '../../providers/user/user-driver';
import { NotificationProvider } from '../../providers/notification/notification';
import { NavigationProvider } from '../../providers/navigation/navigation';

interface ISegments {
    title: string;
    statusGroup: number[];
    canReorder?: boolean;
    canSendMail?: boolean;
}

@IonicPage()
@Component({
    selector: 'page-all-jobs',
    templateUrl: 'all-jobs.html',
})
export class AllJobsPage extends NavigationProvider {
    @ViewChild(Navbar) navBar: Navbar;
    @ViewChild(FabContainer) fab: FabContainer;

    // hide buttons if feature is not enabled
    enableReorder: boolean = Globals.features.showJobsReorderBtn;
    enableMail: boolean = Globals.features.showJobsMail;

    allJobs: Job[] = []; // list of all jobs for progress bar

    selectedJobs: Job[] = []; // list of jobs selected to send message to customer service
    canSendMail: boolean = false; // indicates whether the selected segment allows mailing
    showCheckboxView: boolean = false; // indicates whether to show view to select jobs for customer service

    hasReordered: boolean = false; // indicates whether there was a reordering
    canReorder: boolean = false; // indicates whether the selected segment allows reordering
    btnReorderVal: boolean = false; // value of the reorder button (indicate whether to show view for reordering)

    currList: Job[] = []; // selected segment's list of jobs (e.g. pending only or fail only etc)
    selectedIndex: number = 0;
    segments: ISegments[] = [
        { title: 'PENDING', statusGroup: [JobStatus.Pending, JobStatus.ExpectToBeLate], canReorder: true, canSendMail: true },
        { title: 'FAIL', statusGroup: [JobStatus.Unsuccessful], canSendMail: true },
        { title: 'DONE', statusGroup: [JobStatus.Late, JobStatus.Ontime] },
        { title: 'ALL', statusGroup: [JobStatus.Pending, JobStatus.Late, JobStatus.Ontime, JobStatus.Unsuccessful, JobStatus.ExpectToBeLate] },
    ];

    constructor(
        public driver: UserDriverProvider,
        public menuCtrl: MenuController,
        public navCtrl: NavController,
        public notify: NotificationProvider,
        public platform: Platform,
    ) {
        super({ navCtrl: navCtrl });

        this.platform.ready().then(() => {
            // stop reordering if back button is pressed during reordering
            this.overwriteBackBtnEvent(() => {
                if (this.btnReorderVal === true) {
                    this.btnReorderVal = false;
                } else {
                    this.goPreviousPage();
                }
            });
        });
    }

    ionViewWillEnter() {
        if (Globals.features.showAllJobsMenu === true) {
            this.menuCtrl.enable(true, MenuName.AllJobs);
        }
    }

    ionViewDidLoad() {
        this.navBar.backButtonClick = () => this.goHomePage();
    }

    ionViewDidEnter() {
        this.allJobs = this.driver.jobs;

        // initialise initial view for segment
        this.segmentChanged({ value: this.selectedIndex });

        // this handles the bug where fab list opens but doesn't send event to show checkbox view
        // fab list may open when the user presses the buttons too quickly upon enter
        this.showCheckboxView = this.enableMail && this.fab && this.fab._listsActive;
    }

    ionViewWillLeave() {
        if (this.hasReordered === true) {
            // update current job (i.e. job to do next) if reordering occured
            this.driver.updateCurrentJob();
            this.hasReordered = false;
        }

        this.menuCtrl.enable(false, MenuName.AllJobs);
    }

    itemReorder(event) {
        this.hasReordered = true;

        const from = this.driver.jobs.indexOf(this.currList[event.from]);
        const to = this.driver.jobs.indexOf(this.currList[event.to]);
        this.swapElem(this.driver.jobs, from, to);

        event.applyTo(this.currList);
    }

    segmentChanged(selectedSegment) {
        if (this.driver.jobs.length > 0) {
            const selected = this.segments[selectedSegment.value];

            // update list of jobs to show
            this.currList = this.driver.jobs.filter((job) => selected.statusGroup.indexOf(job.Status) > -1);

            this.canSendMail = selected.canSendMail;  // determine whether selected segment can have send mail view
            this.showCheckboxView = false; // reset checkbox view (in case it was enabled for previous selected segment)

            this.canReorder = selected.canReorder; // determine whether selected segment can have reordering view
            this.btnReorderVal = false; // reset reordering view (in case it was enabled for previous selected segment)
        }

        // always close the fab button when segment changes
        if (this.fab) {
            this.fab.close();
        }
    }

    getColor(job: Job) {
        const colorPair = Globals.jobStatusPair[job.Status];
        return colorPair.color;
    }

    btnChangeView() {
        // toggle checkbox view based on whether fab list is opened
        this.showCheckboxView = this.enableMail && this.fab && !this.fab._listsActive;

        // every toggle should clear the list of selected jobs
        this.selectedJobs = [];
    }

    btnSelectedJob(selectedJob: Job, event: Checkbox) {
        if (event.checked === true) {
            this.selectedJobs.push(selectedJob);
        } else {
            _remove(this.selectedJobs, (job) => job.Id === selectedJob.Id);
        }
    }

    btnJob(job: Job) {
        if (job.isCompleted() === true) {
            this.goPage('CompleteJobDetailsPage', { job: job });
        } else {
            this.goPage('CurrentJobPage', { job: job });
        }
    }

    btnViewFullDetails(job: Job) {
        this.goPage('CompleteJobDetailsPage', { job: job });
    }

    btnSendMail() {
        if (this.selectedJobs.length) {
            this.goPage('CustomerServicePage', { jobs: this.selectedJobs });
        } else {
            this.notify.error('No jobs selected.');
        }
    }

    private swapElem(arr: any[], fromIndex: number, toIndex: number) {
        const element = arr[fromIndex];
        arr.splice(fromIndex, 1);
        arr.splice(toIndex, 0, element);
    }
}
