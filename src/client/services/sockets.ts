import {Injectable} from '@angular/core';
import * as io from 'socket.io-client';

@Injectable({
    providedIn: 'root'
})
export class SocketService {
    private socket;

    constructor() {
        this.socket = io();
    }

    join(data?: any) {
        this.socket.emit('join', data);
    }

    leave() {
        this.socket.emit('leave');
    }

    emit(endpoint: string, data?: any) {
        this.socket.emit(endpoint, data);
    }

    on(endpoint: string, handler) {
        this.socket.on(endpoint, handler);
    }

    destroy() {
        this.socket.removeAllListeners();
    }
}
