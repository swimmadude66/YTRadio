import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable, ReplaySubject, throwError} from 'rxjs';
import {map, tap, switchMap} from 'rxjs/operators';
import {SocketService} from './sockets';
import {StorageService} from './storage';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private session: string;
    private userInfo: any;

    private authEvents: ReplaySubject<{User: any, Session: string}>;

    constructor(
        private _http: HttpClient,
        private _storage: StorageService,
        private _sockets: SocketService,
    ) {
        this.authEvents = new ReplaySubject<{User: any, Session: string}>(1);
    }

    private nuke() {
        this._storage.clear();
        this.session = undefined;
        this.userInfo = undefined;
        this._sockets.leave();
    }

    getSession() {
        return this.session;
    }

    getUser() {
        return this.userInfo;
    }

    hasAccess(): boolean {
        return !!this.userInfo;
    }

    observe(): Observable<{User: any, Session: string}> {
        return this.authEvents;
    }

    identify() {
        this._http.get<{Data: any}>(`/api/auth/`)
        .pipe(
            map(res => res.Data)
        )
        .subscribe(
            data => {
                this.session = data.Session.Key;
                this.userInfo = data.User;
                this._sockets.join(data.Session.Key);
                this.authEvents.next({User: data.User, Session: data.Session.Key});
            },
            err => console.error(err)
        );
    }

    logIn(creds): Observable<any> {
        if (!creds || !creds.Username || !creds.Password) {
            return throwError('Need login creds');
        }
        return this._http.post<{Data: any}>('/api/login', creds)
            .pipe(
                map(res => res.Data),
                tap(data => {
                    this.session = data.Session;
                    this.userInfo = data.User;
                    this._sockets.join(data.Session);
                    this.authEvents.next(data);
                })
            );
    }

    signUp(creds): Observable<any> {
        if (!creds || !creds.Username || !creds.Email || !creds.Password) {
            return throwError('Need signup creds');
        }
        return this._http.post('/api/signup', creds, {responseType: 'text' as 'text'})
        .pipe(
            switchMap(_ => this.logIn(creds))
        );
    }

    expireSocket() {
        this.userInfo = null;
        this.session = null;
        this.authEvents.next(null);
    }

    logOut(): Observable<any> {
        return this._http.post('/api/logOut', null)
        .pipe(
            tap(
                res => this.nuke(),
                err => this.nuke(),
                () => this.authEvents.next(null)
            )
        );
    }
}
