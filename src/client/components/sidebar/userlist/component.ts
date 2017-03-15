import {SocketService} from '../../../services/';
import {Component, OnDestroy, OnInit} from '@angular/core';

@Component({
    selector: 'user-list',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class UserListComponent implements OnInit, OnDestroy {

    private onlineUsers: string[];

    constructor(
        private _sockets: SocketService
    ) {}

    ngOnInit() {
        this.onlineUsers = [];
        this._sockets.onRoot('userList', (list) => {
            this.onlineUsers = list;
        });
    }

    ngOnDestroy() {
        this._sockets.destroyRoot();
    }
}
