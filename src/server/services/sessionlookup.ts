import {Observable} from 'rxjs/Rx';
import {Session} from '../models/session';
import {User} from '../models/user';
import {Database} from './db';


export class SessionLookup {

    constructor(private db: Database) { }

    lookupSession(sessionId): Observable<Session> {
        let keylookup = 'Select users.`Username`, users.`ID`, users.`Role`, sessions.`Key` from sessions \
        join users on sessions.`UserID` = users.`ID` \
        Where sessions.`Active`=1 AND `users`.`Active`=1 AND sessions.`Key`=?;';
        return this.db.query(keylookup, [sessionId])
        .map(results => {
            if (!results || !results.length) {
                return null;
            }
            let result = results[0];
            let user: User = {
                ID: result.ID,
                Username: result.Username,
                Role: result.Role,
                Active: true
            };
            let session: Session = {
                Key: result.Key,
                UserID: user.ID,
                User: user,
                Active: true
            }
            return session;
        });
    }
}
