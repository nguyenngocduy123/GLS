
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
declare type GetDataHandler<T> = () => Observable<T>;

export class VrpCacheable<T> {

    cachedData: T;
    dataSubject: ReplaySubject<T>;
    data$: Observable<T>;

    updateSubject: Subject<{ data: T, purpose: string }>;
    update$: Observable<{ data: T, purpose: string }>;

    queryObject: any; // to store query info such as date range

    getDataHandler: GetDataHandler<T>;
    shouldDataBeUpdated: (d: any) => boolean;

    constructor() {
        this.dataSubject = new ReplaySubject(1);
        this.data$ = this.dataSubject.asObservable();

        this.updateSubject = new Subject();
        this.update$ = this.updateSubject.asObservable();

        this.shouldDataBeUpdated = () => true;
    }

    static beforeDataQuery: () => any = () => { };
    static afterDataQuery: () => any = () => { };

    getData$() {
        if (!this.getDataHandler) {
            throw new Error('getHandler is not defined');
        }
        if (!this.cachedData) {// if no cachedData, use getHandler to query data
            VrpCacheable.beforeDataQuery();
            this.getDataHandler().pipe(finalize(() => VrpCacheable.afterDataQuery()))
                .subscribe((res: T) => {
                    this.cachedData = res;
                    this.dataSubject.next(res);
                }, (err) => this.dataSubject.error(err));
        } else {
            this.dataSubject.next(this.cachedData);
        }
    }

    clearCache(): void {
        this.cachedData = undefined;
    }

    refresh(): void {
        this.clearCache();
        this.getData$();
    }

}
