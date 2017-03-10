
export class UserDirectory {

    private usertosocket = {};
    private sockettouser = {};

    constructor() { }

    connect(socketid) {
        this.sockettouser[socketid] = null;
        return this.sockettouser;
    }

    disconnect(socketid) {
        let user = null;
        if (this.sockettouser[socketid]) {
            user = this.sockettouser[socketid];
            delete this.usertosocket[user.Username];
        }
        delete this.sockettouser[socketid];
        return user;
    }

    join(socketid, user) {
        let oldsock = null;
        if (user.Username in this.usertosocket) {
            oldsock = this.usertosocket[user.Username];
        }
        this.usertosocket[user.Username] = socketid;
        this.sockettouser[socketid] = user;
        return oldsock;
    }

    leave(socketid) {
        let user = null;
        if (this.sockettouser[socketid]) {
            user = this.sockettouser[socketid];
            delete this.usertosocket[user.Username];
        }
        this.sockettouser[socketid] = null;
        return user;
    }

    getsockets(username) {
        if (!username) {
            return this.sockettouser;
        }
        if (username in this.usertosocket) {
            return this.usertosocket[username];
        } else {
            return null;
        }
    }

    getuser(socketid) {
        if (socketid in this.sockettouser) {
            return this.sockettouser[socketid];
        } else {
            return null;
        }
    }

    getusers() {
        return this.usertosocket;
    }
}
