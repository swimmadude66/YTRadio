
export class User {
    ID: number;
    Username: string;
    Email?: string;
    Password?: string;
    Salt?: string
    Role: 'LISTENER' | 'DJ' | 'LIEUTENANT' | 'COLONEL' | 'GENERAL' | 'HOST' | 'ADMIN';
    Confirm?: string;
    Active: boolean | 0 | 1;
}
