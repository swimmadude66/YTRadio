import {Observable} from 'rxjs/Rx';
import { Database } from '../services/db';
import { createHash } from 'crypto';
import * as uuid from 'uuid/v4';

module.exports = (APP_CONFIG) => {
    const router = require('express').Router();
    const db: Database = APP_CONFIG.db;

    /*
    * Identify users as anon or signed in
    */
    // try the cookie first
    router.use((req, res, next) => {
        if (res.locals.usersession) {
            return next();
        }
        if (!req.signedCookies || !req.signedCookies[APP_CONFIG.cookie_name]) {
            res.locals.user = null;
            return next();
        }
        let authZ = req.signedCookies[APP_CONFIG.cookie_name];
        let keylookup = 'Select Users.`Username`, Users.`ID`, Users.`Role`, Sessions.`Key` from Sessions join Users on Sessions.`UserID` = Users.`ID` Where Sessions.`Active`=1 AND Sessions.`Key`=?;';
        db.query(keylookup, [authZ])
        .subscribe(
            results => {
                if (!results || results.length < 1) {
                    return next();
                }
                let user = results[0];
                res.locals.usersession = user;
                return next();
            }, err => {
                return next();
            }
        );
    });

    // next try API codes in the headers
    router.use((req, res, next) => {
        if (res.locals.usersession) {
            return next();
        }
        let authZ = req.headers.Authorization || req.headers.authorization;
        if (!authZ) {
            return next();
        }
        let keylookup = 'Select Users.`Username`, Users.`ID`, Users.`Role`, Sessions.`Key` from Sessions join Users on Sessions.`UserID` = Users.`ID` Where Sessions.`Active`=1 AND Sessions.`Key`=?;';
        db.query(keylookup, [authZ])
        .subscribe(
            results => {
                if (!results || results.length < 1) {
                    return next();
                }
                let user = results[0];
                res.locals.usersession = user;
                return next();
            }, err => {
                return next();
            }
        );
    });

    /*
    * Public Methods
    */
    router.post('/signup', (req, res) => {
        let body = req.body;
        if (!body || !body.Username || !body.Email || !body.Password) {
            return res.status(400).send('Username, Email, and Password are required fields');
        }
        let salt = uuid();
        let encpass = createHash('sha256').update(salt + '|' + body.Password).digest('hex');
        db.query('Insert into Users(`Username`, `Email`, `Password`, `Salt`, `Confirm`, `Active`) VALUES(?,?,?,?,?,1);', [body.Username, body.Email, encpass, salt, uuid()])
        .flatMap(() => {
            return db.query('Insert into Playlists(`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES ((Select `ID` from `Users` where `Username`=?), \'Default\', \'[]\', 0);', [body.Username]);
        })
        .subscribe(
        result => res.send('Signed up successfully.'),
        err => {
            console.error(err);
            return res.status(500).send('Error signing up');
        });
    });

    // router.get('/verification/:v_key', (req, res) => {
    //     db.query('Update Users set `Active`=1 where `Confirm`=?', [req.params.v_key])
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
        db.query('Select `Password`, `Salt`, `Role`, `ID`, `Username`, `Active` from Users where `Username` = ?', [body.Username])
        .flatMap(
        results => {
            if (results.length < 1) {
                return Observable.throw('Invalid username and/or password');
            }
            let user = results[0];
            if (user.Active === 0) {
                return Observable.throw('Invalid username and/or password');
            }
            let validpass = (createHash('sha256').update(user.Salt + '|' + body.Password).digest('hex') === user.Password);
            if (!validpass) {
                return Observable.throw('Invalid username and/or password');
            }
            let public_user = { ID: user.ID, Username: user.Username, Role: user.Role };
            let sid = uuid();
            return db.query('Insert into Sessions(`Key`, `UserID`) Values(?, ?);', [sid, user.ID])
            .map(() => {
                return {Session: sid, User: public_user};
            });
        })
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
        let keylookup = 'Select Users.`Username`, Users.`ID`, Users.`Role`, Sessions.`Key` from Sessions join Users on Sessions.`UserID` = Users.`ID` Where Sessions.`Active`=1 AND Sessions.`Key`=?;';
        db.query(keylookup, [sid])
        .subscribe(
            results => {
                if (results.length < 1) {
                    return res.status(400).send('Invalid SessionID');
                }
                let uinfo = results[0];
                return res.send({ Data: { Session: { Key: uinfo.Key }, User: { Username: uinfo.Username, ID: uinfo.ID, Role: uinfo.Role } } });
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
        db.query('Update `Sessions` Set `Active`=0 Where `Key`=?;', [session])
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
    router.use('/chat', require('./chat')(APP_CONFIG));

    return router;
};
