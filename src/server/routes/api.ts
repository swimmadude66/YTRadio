import {throwError, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {Session} from '../models/session';
import {Database} from '../services/db';
import {SessionLookup} from '../services/sessionlookup';
import * as uuid from 'uuid/v4';
import {Router} from 'express';
import {AuthService} from '../services/auth';

module.exports = (APP_CONFIG) => {
    const router = Router();
    const db: Database = APP_CONFIG.db;
    const sessionLookup: SessionLookup = APP_CONFIG.sessionLookup;
    const auth  = new AuthService();
    /*
    * Public Methods
    */
    router.post('/signup', (req, res) => {
        const body = req.body;
        if (!body || !body.Username || !body.Email || !body.Password) {
            return res.status(400).send('Username, Email, and Password are required fields');
        }
        const salt = uuid();
        auth.hashPassword(`${salt}|${body.Password}`)
        .pipe(
            switchMap((passConfig: {algo: string, hash: string}) => {
                return db.query(
                    'Insert into users(`Username`, `Email`, `Password`, `Algorithm`, `Salt`, `Confirm`, `Active`) VALUES(?,?,?,?,?,?,1);',
                    [body.Username, body.Email, passConfig.hash, passConfig.algo, salt, uuid()]
                )
            }),
            switchMap(() => {
                return db.query('Insert into playlists(`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES ((Select `ID` from `users` where `Username`=?), \'Default\', \'[]\', 0);', [body.Username]);
            })
        )
        .subscribe(
            result => res.send('Signed up successfully.'),
            err => {
                console.error(err);
                return res.status(500).send('Error signing up');
            }
        );
    });

    // router.get('/verification/:v_key', (req, res) => {
    //     db.query('Update users set `Active`=1 where `Confirm`=?', [req.params.v_key])
    //     .subscribe(
    //     result => res.redirect('/'),
    //     err => {
    //         console.error(err);
    //         return res.send('Error confirming email');
    //     });
    // });

    router.post('/login', (req, res) => {
        let body = req.body;
        if (!body || !body.Username || !body.Password) {
            return res.status(400).send('Username and Password are required fields');
        }
        db.query('Select `Algorithm`, `Password`, `Salt`, `Role`, `ID`, `Username`, `Active` from users where `Username` = ?', [body.Username])
        .pipe(
            switchMap(results => {
                if (results.length < 1) {
                    return throwError('Invalid username and/or password');
                }
                let user = results[0];
                if (user.Active === 0) {
                    return throwError('Invalid username and/or password');
                }
                return auth.validatePassword(user, body.Password)
                .pipe(
                    switchMap(isValid => {
                        if (!isValid) {
                            return throwError('Invalid username and/or password');
                        } else {
                            if (user.Algorithm !== 'argon2') { // detect if user needs an update
                                return auth.hashPassword(`${user.Salt}|${body.Password}`);
                            }  else {
                                return of(null);
                            }
                        }
                    }),
                    switchMap(newPass => {
                        if (newPass) {
                            return db.query('Update users SET `Algorithm`=?, `Password`=? WHERE `ID`=?', [newPass.algo, newPass.hash, user.ID]);
                        } else {
                            return of(null);
                        }
                    }),
                    switchMap(_ => {
                        const public_user = { ID: user.ID, Username: user.Username, Role: user.Role };
                        const sid = uuid();
                        return db.query('Insert into sessions(`Key`, `UserID`) Values(?, ?);', [sid, user.ID])
                        .pipe(
                            map(() => {
                                return {Session: sid, User: public_user};
                            })
                        )
                    })
                );
            })
        )
        .subscribe(
            result => {
                res.cookie(APP_CONFIG.cookie_name, result.Session, {
                    maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // ten year expiration
                    path: '/',
                    httpOnly: true,
                    secure: req.secure,
                    signed: true,
                    sameSite: true
                });
                return res.send({ Data:  result});
            },
            err => {
                return res.status(400).send('Invalid username and/or password');
            }
        );
    });

    router.get('/auth/', (req, res) => {
        let sid;
        if (!res.locals || !res.locals.usersession || !res.locals.usersession.Key) {
            if (!req.query || !req.query.sessionId) {
                return res.status(400).send('Missing cookie or query param');
            } else {
                sid = req.query.sessionID;
            }
        } else {
            sid = res.locals.usersession.Key;
        }
        sessionLookup.lookupSession(sid)
        .subscribe(
            result => {
                if (!result) {
                    return res.status(400).send('Invalid SessionID');
                }
                let uinfo: Session = result;
                return res.send({ Data: { Session: { Key: uinfo.Key }, User: { Username: uinfo.User.Username, ID: uinfo.UserID, Role: uinfo.User.Role } } });
            },
            err => {
                console.error(err);
                return res.status(500).send('Could not retrieve session data');
            }
        );
    });

    router.post('/logOut', (req, res) => {
        if (!res.locals || !res.locals.usersession || !res.locals.usersession.Key) {
            return res.status(204).end();
        }
        let session = res.locals.usersession.Key;
        db.query('Update `sessions` Set `Active`=0 Where `Key`=?;', [session])
        .subscribe(
            result => res.status(204).end(),
            err => {
                console.error(err);
                return res.status(500).send('Could not terminate session');
            }
        );
    });

    /*
    * External Methods
    */
    router.use('/search', require('./search')(APP_CONFIG));
    router.use('/radio', require('./radio')(APP_CONFIG));
    router.use('/playlists', require('./playlists')(APP_CONFIG));

    return router;
};
