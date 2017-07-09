import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {CookieService} from 'ngx-cookie-service';
import {Observable, ReplaySubject} from 'rxjs/Rx';
import {SocketService} from './sockets';

@Injectable()
export class AuthService {

    private session: string;
    private userInfo: any;

    private authEvents: ReplaySubject<{User: any, Session: string}>;

    constructor(
        private _http: Http,
        private _cookies: CookieService,
        private _sockets: SocketService,
    ) {
        this.authEvents = new ReplaySubject<{User: any, Session: string}>(1);
    }

    private nuke() {
        this._cookies.deleteAll();
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
        this._http.get(`/api/auth/`)
        .map(res => res.json().Data)
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
            return Observable.throw('Need login creds');
        }
        return this._http.post('/api/login', creds)
            .map(res => res.json().Data)
            .do(data => {
                this.session = data.Session;
                this.userInfo = data.User;
                this._sockets.join(data.Session);
                this.authEvents.next(data);
            });
    }

    signUp(creds): Observable<any> {
        if (!creds || !creds.Username || !creds.Email || !creds.Password) {
            return Observable.throw('Need signup creds');
        }
        return this._http.post('/api/signup', creds)
        .flatMap(_ => this.logIn(creds));
    }

    expireSocket() {
        this.userInfo = null;
        this.session = null;
        this.authEvents.next(null);
    }

    logOut(): Observable<any> {
        return this._http.post('/api/logOut', null)
        .do(
            res => this.nuke(),
            err => this.nuke(),
            () => this.authEvents.next(null)
        );
    }
}
