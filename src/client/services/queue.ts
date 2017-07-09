import {ReplaySubject, Subject} from 'rxjs/Rx';
import {SocketService} from './sockets';
import {Injectable} from '@angular/core';

@Injectable()
export class QueueService {
    private queue: string[] = [];
    private qSubject: Subject<string[]> = new ReplaySubject<string[]>(1);

    constructor(
        private _sockets: SocketService
    ) {
        this._sockets.on('queue_updated', (data) => {
            this.queue = data;
            this.qSubject.next(data);
        });
    }

    checkPresence (uname: string): boolean {
        if (!uname) {
            return false;
        }
        return (this.queue.indexOf(uname) >= 0);
    }

    getQueue(): string[] {
        return this.queue;
    }

    observeQueue(): Subject<string[]> {
        return this.qSubject;
    }
}
