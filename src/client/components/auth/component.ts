import {Component} from '@angular/core';
import {AuthService} from '../../services/auth';

declare var $;

@Component({
    selector: 'auth',
    templateUrl: './template.html',
    styleUrls: ['./styles.scss']
})
export class AuthComponent {

    action = 'Log In';
    signupText = false;
    isLoading = false;
    auth: any = {};

    errormessage: string;

    constructor(
        private _auth: AuthService
    ) {}

    closeModal() {
        $('#authModal').hide();
    }

    passwordMismatch() {
        return (this.action === 'Sign Up' && this.auth.Password && this.auth.Password2 !== this.auth.Password);
    }

    formInvalid(form) {
        let htmlinValid = form.invalid;
        let busy = this.isLoading;
        let pwdMismatch = this.passwordMismatch();
        return htmlinValid || busy || pwdMismatch;
    }

    toggleAction() {
        this.errormessage = undefined;
        if (this.action === 'Log In') {
            this.action = 'Sign Up';
        } else {
            this.action = 'Log In';
        }
    }

    submit(e) {
        e.preventDefault();
        this.errormessage = undefined;
        this.isLoading = true;
        if (this.action === 'Log In') {
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
                    this.closeModal();
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
