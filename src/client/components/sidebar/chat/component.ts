import {SocketService, AuthService} from '../../../services/';
import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Http} from '@angular/http';

@Component({
    selector: 'chat',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class ChatComponent implements OnDestroy {

    @ViewChild('scrollMe') private messageWindow: ElementRef;

    private messages = [];
    private messageText: any = {};

    constructor(
        private _http: Http,
        private _auth: AuthService,
        private _sockets: SocketService
    ) {
        this._sockets.onChat('session_expired', (data) => {
            this._auth.logOut().subscribe();
        });

        this._sockets.onChat('motd', (message) => {
            this.messages.push({Author: 'MotD', Message: message});
        });

        this._sockets.onChat('user_join', (username) => {
            this.messages.push({Author: 'Server', Message: 'User ' + username + ' just joined.'});
        });

        this._sockets.onChat('user_left', (username) => {
            this.messages.push({Author: 'Server', Message: 'User ' + username + ' jumped ship.'});
        });

        this._sockets.onChat('messageFromServer', (payload) => {
            this.messages.push({Author: payload.sender, Message: decodeURIComponent(payload.message)});
            if (this.messages.length > 100) {
                this.messages.splice(0, this.messages.length - 100);
            }
            this.scrollToBottom();
        });
    }

    ngOnDestroy() {
        this._sockets.destroyChat();
    }

    scrollToBottom(): void {
        try {
            this.messageWindow.nativeElement.scrollTop = this.messageWindow.nativeElement.scrollHeight;
        } catch (e) {
            console.error(e);
        }
    }

    getUser() {
        return this._auth.getUser();
    };

    sendMessage() {
        if (this.messageText && this.messageText.contents && this.messageText.contents.trim().length > 0) {
            this._sockets.chatEmit('messageToServer', encodeURIComponent(this.messageText.contents));
            this.messageText.contents = '';
        }
    };
}
