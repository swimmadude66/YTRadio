import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable()
export class SocketService {

    private chatSocket;
    private mediaSocket;
    private rootSocket;

    constructor() {
        this.chatSocket = io('/chat');
        this.mediaSocket = io('/media');
        this.rootSocket = io();
    }

    join(data?: any) {
        this.chatSocket.emit('join', data);
        this.mediaSocket.emit('join', data);
    }

    leave() {
        this.chatSocket.emit('leave');
        this.mediaSocket.emit('leave');
    }

    chatEmit(endpoint: string, data?: any) {
        this.chatSocket.emit(endpoint, data);
    }

    mediaEmit(endpoint: string, data?: any) {
        this.mediaSocket.emit(endpoint, data);
    }

    rootEmit(endpoint: string, data?: any) {
        this.rootSocket.emit(endpoint, data);
    }

    onChat(endpoint: string, handler) {
        this.chatSocket.on(endpoint, handler);
    }

    onMedia(endpoint: string, handler) {
        this.mediaSocket.on(endpoint, handler);
    }

    onRoot(endpoint: string, handler) {
        this.rootSocket.on(endpoint, handler);
    }

    destroyChat() {
        this.chatSocket.removeAllListeners();
    }

    destroyMedia() {
        this.mediaSocket.removeAllListeners();
    }

    destroyRoot() {
        this.rootSocket.removeAllListeners();
    }
}
