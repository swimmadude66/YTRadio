
export interface User {
    ID: number;
    Username: string;
    Email?: string;
    Password?: string;
    Algorithm?: 'sha256' | 'sha512' | 'argon2';
    Salt?: string
    Role: 'LISTENER' | 'DJ' | 'LIEUTENANT' | 'COLONEL' | 'GENERAL' | 'HOST' | 'ADMIN';
    Confirm?: string;
    Active: boolean | 0 | 1;
}
