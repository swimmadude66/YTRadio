import * as async from 'async';

let recentMessages = [];

module.exports = (APP_CONFIG) => {
    const router = require('express').Router();
    const directory = APP_CONFIG.userDirectory;
    let chatManager = APP_CONFIG.Socks.of('/chat');

    function updateUserList() {
        let userList = [];
        let anon_listeners = 0;
        async.each(Object.keys(directory.getsockets()), (socket, cb) => {
            let username = (directory.getuser(socket) || { Username: null }).Username;
            if (username) {
                if (userList.indexOf(username) === -1) {
                    userList.push(username);
                    return cb();
                }
            } else {
                anon_listeners++;
                return cb();
            }
        }, (err) => {
            if (anon_listeners > 0) {
                let anon_string = anon_listeners + ' Anonymous guest';
                if (anon_listeners > 1) {
                    anon_string += 's';
                }
                if (userList.length > 0) {
                    anon_string = 'Plus ' + anon_string;
                }
                userList.push(anon_string);
            }
            APP_CONFIG.Socks.sockets.emit('userList', userList);
        });
    }

    // connection event
    chatManager.on('connection', (socket) => {
        // update/send userList when guest joins (on socket connection and before user join)
        directory.connect(socket.id);
        updateUserList();

        // join the chatroom
        socket.on('join', (user) => {
            if (!(user.Username in directory.getusers())) {
                socket.emit('user_join', user.Username);
                console.log(user.Username + ' joined chat!');
            }
            // add to maps

            let oldsock = directory.join(socket, user);
            if (oldsock) {
                oldsock.emit('session_expired');
            }
            updateUserList();
            recentMessages.forEach((rnode) => {
                socket.emit('messageFromServer', rnode);
            });
        });

        // send a message
        socket.on('messageToServer', (message) => {
            let chatPayload = {
                sender: directory.getuser(socket.id).Username,
                timestamp: new Date(),
                message: message
            };
            chatManager.emit('messageFromServer', chatPayload);
            // add message to recent list
            recentMessages.push(chatPayload);
            if (recentMessages.length > 10) {
                recentMessages.shift();
            }
            console.log('Chat: ', chatPayload.timestamp, chatPayload.sender, chatPayload.message);
        });

        // private message
        socket.on('privateMessage', (payload) => {

            let privateMessage = {
                sender: directory.getuser(socket.id).Username,
                timestamp: new Date(),
                message: payload.message
            };
            if ('/chat' in directory.getsockets(payload.to)) {
                directory.getsockets(payload.to)['/chat'].emit('private_message', privateMessage);
                console.log('Chat-PM: ', privateMessage.timestamp, privateMessage.sender, payload.to, privateMessage.message);
            }
        });

        socket.on('updateUserList', function () {
            updateUserList();
        });

        socket.on('leave', function () {
            let user = directory.leave(socket.id);
            if (user) {
                if (!directory.getsockets(user.Username)) {
                    socket.broadcast.emit('user_left', user.Username);
                    console.log(user.Username + ' left chat.');
                }
            }
            updateUserList();
        });

        socket.on('disconnect', function () {
            let user = directory.disconnect(socket.id);
            if (user) {
                if (!directory.getsockets(user.Username)) {
                    socket.broadcast.emit('user_left', user.Username);
                    console.log(user.Username + ' left chat.');
                }
            }
            updateUserList();
        });
    });

    router.all((req, res, next) => {
        return next();
    });

    return router;
};
