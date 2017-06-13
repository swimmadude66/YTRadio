import {SocketService} from './sockets';
import {Observable} from 'rxjs/Rx';
import { Http } from '@angular/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Injectable()
export class AuthService {

    private session: string;
    private userInfo: any;

    constructor(
        private _http: Http,
        private _cookies: CookieService,
        private _sockets: SocketService,
    ) {
        this._http.get(`/api/auth/`)
        .map(res => res.json().Data)
        .subscribe(
            data => {
                this.session = data.Session.Key;
                this.userInfo = data.User;
                this._sockets.join(data.User);
            },
            err => console.error(err)
        );
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

    logIn(creds): Observable<any> {
        if (!creds || !creds.Username || !creds.Password) {
            return Observable.throw('Need login creds');
        }
        return this._http.post('/api/login', creds)
            .map(res => res.json().Data)
            .do(data => {
                this.session = data.Session;
                this.userInfo = data.User;
                let future = new Date().getTime() + (52 * 7 * 24 * 60 * 60000);
                let eDate = new Date(future);
                this._cookies.set('ytrk_66', data.Session, eDate);
                this._sockets.join(data.User);
            });
    }

    signUp(creds): Observable<any> {
        if (!creds || !creds.Username || !creds.Email || !creds.Password) {
            return Observable.throw('Need signup creds');
        }
        return this._http.post('/api/signup', creds)
        .flatMap(_ => this.logIn(creds));
    }

    logOut(): Observable<any> {
        return this._http.post('/api/logOut', null)
        .do(
            res => this.nuke(),
            err => this.nuke()
        );
    }
}
