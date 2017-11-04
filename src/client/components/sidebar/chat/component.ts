import {SocketService, AuthService} from '../../../services/';
import {Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {Subscription} from 'rxjs/Rx';

@Component({
    selector: 'chat',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class ChatComponent implements OnDestroy {

    @ViewChild('scrollMe') messageWindow: ElementRef;

    messages = [];
    messageText: any = {};
    user: any;
    private authSubscription: Subscription;

    constructor(
        private _auth: AuthService,
        private _sockets: SocketService
    ) {
        this._sockets.on('session_expired', (data) => {
            this._auth.expireSocket();
        });

        this._sockets.on('motd', (message) => {
            this.messages.push({Author: 'MotD', Message: message});
        });

        this._sockets.on('user_join', (username) => {
            this.messages.push({Author: 'Server', Message: 'User ' + username + ' boarded.'});
        });

        this._sockets.on('user_left', (username) => {
            this.messages.push({Author: 'Server', Message: 'User ' + username + ' jumped ship.'});
        });

        this._sockets.on('messageFromServer', (payload) => {
            this.messages.push({Author: payload.sender, Message: decodeURIComponent(payload.message)});
            if (this.messages.length > 100) {
                this.messages.splice(0, this.messages.length - 100);
            }
            this.scrollToBottom();
        });

        this.authSubscription = this._auth.observe().subscribe(
            event => {
                if (event && event.User) {
                    this.user = event.User;
                } else {
                    this.user = null;
                }
            }
        )
    }

    ngOnDestroy() {
        this._sockets.destroy();
        if (this.authSubscription && this.authSubscription.unsubscribe) {
            this.authSubscription.unsubscribe();
        }
    }

    scrollToBottom(): void {
        try {
            this.messageWindow.nativeElement.scrollTop = this.messageWindow.nativeElement.scrollHeight;
        } catch (e) {
            console.error(e);
        }
    }

    sendMessage() {
        if (this.messageText && this.messageText.contents && this.messageText.contents.trim().length > 0) {
            this._sockets.emit('messageToServer', encodeURIComponent(this.messageText.contents));
            this.messageText.contents = '';
        }
    };
}
