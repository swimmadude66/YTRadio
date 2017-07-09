import {Subscription} from 'rxjs/Rx';
import {QueueService} from '../../../services/';
import {Component, OnDestroy, OnInit} from '@angular/core';

@Component({
    selector: 'queue',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class QueueComponent implements OnInit, OnDestroy {

    private sub: Subscription;
    queue: string[];

    constructor(
        private _queue: QueueService
    ) {}

    ngOnInit() {
        this.queue = this._queue.getQueue();
        this.sub = this._queue.observeQueue().subscribe(
            q => this.queue = q
        );
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }
}
