import {SessionLookup} from '../services/sessionlookup';
import {Router} from 'express';

module.exports = (APP_CONFIG) => {
    const router = Router();
    const sessionLookup: SessionLookup = APP_CONFIG.sessionLookup;
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
        sessionLookup.lookupSession(authZ)
        .subscribe(
            result => {
                if (!result) {
                    return next();
                }
                let usersession = result;
                res.locals.usersession = usersession;
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
        sessionLookup.lookupSession(authZ)
        .subscribe(
            result => {
                if (!result) {
                    return next();
                }
                let usersession = result;
                res.locals.usersession = usersession;
                return next();
            }, err => {
                return next();
            }
        );
    });

    return router;
};
