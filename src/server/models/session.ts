import {User} from './user';

export class Session {
    ID?: number;
    Key: string;
    UserID: number;
    User: User;
    Active: boolean | 0 | 1;
}

