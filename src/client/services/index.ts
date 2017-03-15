import {PlayerService} from './player';
import {QueueService} from './queue';
import {SocketService} from './sockets';
import {AuthService} from './auth';

export {
    AuthService,
    SocketService,
    QueueService,
    PlayerService
}

export const ALL_SERVICES = [
    AuthService,
    SocketService,
    QueueService,
    PlayerService
];
