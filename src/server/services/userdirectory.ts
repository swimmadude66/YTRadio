
export class UserDirectory {

    private usertosocket = {};
    private sockettouser = {};

    constructor() { }

    connect(socketid) {
        this.sockettouser[socketid] = null;
        return this.sockettouser;
    }

    disconnect(socketid) {
        let user = this.sockettouser[socketid];
        if (user) {
            let userSock = this.usertosocket[user.Username];
            if (userSock.id === socketid) {
                delete this.usertosocket[user.Username];
            }
        }
        delete this.sockettouser[socketid];
        return user;
    }

    join(socket, user) {
        let oldsock = null;
        if (user.Username in this.usertosocket) {
            oldsock = this.usertosocket[user.Username];
        }
        // in case of duplicate joins, check if the socket is new
        if (oldsock) {
            if (socket.id === oldsock.id) {
                return null;
            }
            // remove user's old socket
            delete this.sockettouser[oldsock.id];
        }
        this.sockettouser[socket.id] = user;
        this.usertosocket[user.Username] = socket;
        return oldsock;
    }

    leave(socketid) {
        let user = null;
        if (this.sockettouser[socketid]) {
            user = this.sockettouser[socketid];
            let userSocket = this.usertosocket[user.Username]
            if (userSocket && userSocket.id === socketid) {
                delete this.usertosocket[user.Username];
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
