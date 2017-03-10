import {Component} from '@angular/core';
import {AuthService} from '../../services/authservice';
import { Http } from '@angular/http';

@Component({
    selector: 'auth',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class AuthComponent {

    private action = 'Log In';
    private signupText = false;
    private isLoading = false;
    private auth: any = {};

    private errormessage: string;

    constructor(
        private _http: Http,
        private _auth: AuthService
    ) { }

    // closeModal(rval) {
    //     //  Manually hide the modal using bootstrap.
    //     $element.modal('hide');
    //     //  Now close as normal, but give 500ms for bootstrap to animate
    //     close(rval, 500);
    // }

    toggleAction() {
        this.errormessage = undefined;
        if (this.action === 'Log in') {
            this.action = 'Sign up';
        } else {
            this.action = 'Log in';
        }
    }

    submit() {
        this.errormessage = undefined;
        this.isLoading = true;
        if (this.action === 'Log in') {
            this._auth.logIn(this.auth)
            .subscribe(
                session => {
                    this.isLoading = false;
                    this.closeModal(session);
                },
                err => {
                    this.isLoading = false;
                    this.errormessage = err;
                }
            );
        } else {
            this._auth.signUp(this.auth)
            .subscribe(
                session => {
                    this.isLoading = false;
                    this.signupText = true;
                },
                error => {
                    this.isLoading = false;
                    this.errormessage = error;
                }
            );
        }
    }
}
