
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

    join(socket, user) {
        let idParts = socket.id.split('#');
        let room = idParts[0];
        let oldsock = null;
        if ((user.Username in this.usertosocket) && (room in this.usertosocket[user.Username])) {
            oldsock = this.usertosocket[user.Username][room];
        }
        let socks = this.usertosocket[user.Username] || {};
        socks[room] = socket;
        this.usertosocket[user.Username] = socks;
        this.sockettouser[socket.id] = user;
        return oldsock;
    }

    leave(socketid) {
        let user = null;
        let idParts = socketid.split('#');
        let room = idParts[0];
        if (this.sockettouser[socketid]) {
            user = this.sockettouser[socketid];
            if (room in this.usertosocket[user.Username]) {
                delete this.usertosocket[user.Username][room];
                if (Object.keys(this.usertosocket[user.Username]).length < 1) {
                    delete this.usertosocket[user.Username];
                }
            }
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
