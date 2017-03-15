import {Component} from '@angular/core';
import {AuthService} from '../../services/auth';
import { Http } from '@angular/http';

declare var $;

@Component({
    selector: 'auth',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class AuthComponent {

    private action = 'Log in';
    private signupText = false;
    private isLoading = false;
    private auth: any = {};

    private errormessage: string;

    constructor(
        private _http: Http,
        private _auth: AuthService
    ) {}

    closeModal() {
        $('#authModal').hide();
    }

    passwordMismatch() {
        return (this.action === 'Sign up' && this.auth.Password && this.auth.Password2 !== this.auth.Password);
    }

    formInvalid(form) {
        let htmlinValid = form.invalid;
        let busy = this.isLoading;
        let pwdMismatch = this.passwordMismatch();
        return htmlinValid || busy || pwdMismatch;
    }

    toggleAction() {
        this.errormessage = undefined;
        if (this.action === 'Log in') {
            this.action = 'Sign up';
        } else {
            this.action = 'Log in';
        }
    }

    submit(e) {
        e.preventDefault();
        this.errormessage = undefined;
        this.isLoading = true;
        if (this.action === 'Log in') {
            this._auth.logIn(this.auth)
            .subscribe(
                session => {
                    this.isLoading = false;
                    this.closeModal();
                },
                err => {
                    this.isLoading = false;
                    if (err.status === 400) {
                        this.errormessage = 'Invalid Username and/or Password';
                    } else {
                        this.errormessage = 'Could not log in. Try again later';
                    }
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
                    if (error.status === 400) {
                        this.errormessage = 'Invalid Username, Email and/or Password';
                    } else {
                        this.errormessage = 'Could not sign up. Try again later';
                    }
                }
            );
        }
    }
}
