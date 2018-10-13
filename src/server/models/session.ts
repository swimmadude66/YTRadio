import {User} from './user';

export interface Session {
    ID?: number;
    Key: string;
    UserID: number;
    User: User;
    Active: boolean | 0 | 1;
}

