import {from, Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {createHash} from 'crypto';
import * as argon2 from 'argon2';
import {User} from '../models';

export class AuthService {

    hashPassword(password: string): Observable<{algo: string, hash: string}> {
        return this.argonHash(password)
        .pipe(
            map(hash => {
                return {algo: 'argon2', hash};
            }),
            catchError(e => {
                const shaHash = this.sha512Hash(password);
                return of({algo: 'sha512', hash: shaHash});
            })
        );
    }

    argonHash(password: string): Observable<string> {
        return from(argon2.hash(password));
    }

    sha256Hash(password: string): string {
        const shaHash = createHash('sha256').update(password).digest('hex'); // old ones use hex
        return shaHash;
    }

    sha512Hash(password: string): string {
        const shaHash = createHash('sha512').update(password).digest('base64');
        return shaHash;
    }

    validatePassword(user: User, password: string): Observable<boolean> {
        if (user.Algorithm === 'sha256') {
            const sha256Pass = this.sha256Hash(`${user.Salt}|${password}`);
            return of(user.Password === sha256Pass);
        } else if (user.Algorithm === 'sha512') {
            const sha512Pass = this.sha512Hash(`${user.Salt}|${password}`);
            return of(user.Password === sha512Pass);
        } else if (user.Algorithm === 'argon2') {
            return from(argon2.verify(user.Password, `${user.Salt}|${password}`))
            .pipe(
                catchError(e => of(false))
            );
        } else {
            return of(false);
        }
    }
}
