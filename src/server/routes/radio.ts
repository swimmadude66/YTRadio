import * as uuid from 'uuid/v4';

let userQueue = [];
let userinqueue = {};

let currentVideo: any;
let currDJ;
let FETCHING = false;
let ENDCHECKING = false;

let recentMessages = [];

let djtimer;

module.exports = (APP_CONFIG) => {
    const router = require('express').Router();
    const db = APP_CONFIG.db;
    const directory = APP_CONFIG.userDirectory;
    const sessionLookup = APP_CONFIG.sessionLookup;
    const socketManager = APP_CONFIG.Socks;

    function playNextSong(callback) {
        if (FETCHING) {
            return callback();
        }
        if (currentVideo) {
            savehistory(JSON.parse(JSON.stringify(currentVideo)));
        }
        currentVideo = false;
        if (userQueue.length > 0) {
            currDJ = userQueue.shift();
            let sock = directory.getsockets(currDJ);
            if (!sock || sock.length < 1) {
                return playNextSong(callback);
            } else {
                FETCHING = true;
                if (userinqueue[currDJ] && userQueue.indexOf(currDJ) < 0) {
                    userQueue.push(currDJ);
                }
                socketManager.emit('queue_updated', userQueue);
                sock.emit('nextSong_fetch');
                djtimer = setTimeout(() => {
                    FETCHING = false;
                    return playNextSong(() => console.log('Could not reach DJ in time'));
                }, 3000)
                return callback();
            }
        } else {
            socketManager.emit('queue_updated', userQueue);
            socketManager.emit('song_start', { currVid: currentVideo });
            return callback();
        }
    }

    function getTimeElapsed(callback) {
        let now = new Date().getTime();
        if (currentVideo && now < currentVideo.EndTime) {
            return callback(Math.ceil((now - currentVideo.StartTime) / 1000.0));
        } else {
            playNextSong(function () {
                return callback(0);
            });
        }
    }

    function savehistory(playedSong) {
        let insert = 'Insert into `history`(`PlayTime`, `DJ`, `VideoID`, `ListenerCount`, `UpVotes`, `DownVotes`, `Saves`) VALUES(?,?,?,?,0,0,0);';
        db.query(insert, [playedSong.StartTime, playedSong.Info.DJ.ID, playedSong.Info.ID, Object.keys(directory.getsockets()).length])
        .subscribe(
            _ => _,
            err => console.error(err)
        );
    }

    function remove_from_queue(dmw, callback) {
        let ind = userQueue.indexOf(dmw);
        if (ind > -1) {
            userQueue.splice(ind, 1);
            userinqueue[dmw] = false;
            let dmwsocket = directory.getsockets(dmw);
            if (dmwsocket) {
                dmwsocket.emit('queue_kick');
            }
            socketManager.emit('queue_updated', userQueue);
            return callback();
        } else {
            return callback('User not in queue');
        }
    }

    function updateUserList() {
        let userList = [];
        let anon_listeners = 0;
        Object.keys(directory.getsockets()).forEach((socket) => {
            let username = (directory.getuser(socket) || { Username: null }).Username;
            if (username) {
                if (userList.indexOf(username) === -1) {
                    userList.push(username);
                    return;
                }
            } else {
                anon_listeners++;
                return;
            }
        });

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
        socketManager.emit('userList', userList);
    }

    router.post('/songend', (req, res) => {
        if (currentVideo && currentVideo.Info.PlaybackID !== req.body.PlaybackID) {
            return res.status(400).send('Current video does not match ID');
        }
        if (ENDCHECKING) {
            console.log('received duplicate request');
            return res.status(400).send('Currently processing song end');
        }
        ENDCHECKING = true;
        getTimeElapsed((elapsed) => {
            ENDCHECKING = false;
            return res.status(204).end();
        });
    });

    router.use((req, res, next) => {
        if (!res.locals.usersession) {
            return res.status(401).send('Unauthorized');
        } else {
            return next();
        }
    });

    router.post('/queue', (req, res) => {
        if (!directory.getsockets(res.locals.usersession.User.Username)) {
            return res.status(400).send('No known sockets. Please Re-Login');
        } else {
            userinqueue[res.locals.usersession.User.Username] = true;
            if (userQueue.indexOf(res.locals.usersession.User.Username) < 0) {
                userQueue.push(res.locals.usersession.User.Username);
                let current = userQueue.indexOf(currDJ);
                if (current >= 0) {
                    userQueue.splice(current, 1);
                    userQueue.push(currDJ);
                }
                socketManager.emit('queue_updated', userQueue);
            }
            if (!currentVideo && !FETCHING) {
                playNextSong(function () {
                    return res.status(204).end();
                });
            } else {
                return res.status(204).end();
            }
        }
    });

    router.delete('/queue/:username', (req, res) => {
        let dmw = req.params.username;
        if (res.locals.usersession.User.Username === dmw || res.locals.usersession.User.Role === 'ADMIN') {
            remove_from_queue(dmw, (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Could not remove user from queue');
                }
                return res.status(204).end();
            });
        } else {
            return res.status(403).send('User is not authorized to alter the queue');
        }
    });

    router.get('/history', (req, res) => {
        let q = 'Select `users`.`Username`, `videos`.* from `history` join `videos` on `history`.`VideoID`=`videos`.`VideoID` join `users` on `users`.`ID`=`history`.`DJ` ORDER BY `history`.`ID` DESC LIMIT 25;';
        db.query(q)
        .subscribe(
            results => res.send({history: results}),
            err => {
                console.error(err);
                return res.status(500).send('Could not fetch history');
            }
        );
    });

    router.post('/skip', (req, res) => {
        let body = req.body;
        if (!body || !body.PlaybackID) {
            return res.status(400).send('PlaybackID is a required field');
        }
        if (currentVideo) {
            if (res.locals.usersession.User.Role === 'ADMIN' || res.locals.usersession.User.Username === currentVideo.Info.DJ.Username) {
                if (req.body.PlaybackID === currentVideo.Info.PlaybackID) {
                    playNextSong(() => {
                        console.log(res.locals.usersession.User.Username, 'skipped the song');
                        return res.status(204).end();
                    });
                } else {
                    return res.status(400).send('Incorrect PlaybackID, perhaps someone beat you to it?');
                }
            } else {
                return res.status(403).send('You are not allowed to skip this song');
            }
        } else {
            return res.status(400).send('No current video!');
        }
    });

    /* socket stuff */
    socketManager.on('connect', (socket) => {
        getTimeElapsed((elapsed) => {
            socketManager.emit('queue_updated', userQueue);
            socket.emit('welcome', { currVid: currentVideo, startSeconds: elapsed });
        });
        // update/send userList when guest joins (on socket connection and before user join)
        directory.connect(socket.id);
        socket.emit('request_identify', null);
        updateUserList();

        // authenticate to become elegible to DJ and chat
        socket.on('join', (sessionId) => {
            sessionLookup.lookupSession(sessionId)
            .subscribe(
                result => {
                    if (!result || !result.User) {
                        console.error('Could not identify joining user');
                        return;
                    }
                    let user = result.User;
                    if (!(user.Username in directory.getusers())) {
                        socket.emit('user_join', user.Username);
                        console.log(user.Username + ' joined chat!');
                    }
                    if (userinqueue[user.Username]) {
                        socket.emit('inQueue', true);
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
                }, err => {
                    console.error(err);
                }
            );
        });

        socket.on('nextSong_response', (songdata) => {
            if (FETCHING) {
                FETCHING = false;
                if (djtimer) {
                    clearTimeout(djtimer);
                }
                djtimer = undefined;
                let dj = directory.getuser(socket.id);
                if (songdata) {
                    let newguy = songdata;
                    newguy.PlaybackID = uuid.v4();
                    newguy.DJ = dj;
                    let now = new Date().getTime();
                    currentVideo = { Info: newguy, StartTime: now, EndTime: now + newguy.Duration };
                    socketManager.emit('song_start', { currVid: currentVideo });
                } else {
                    remove_from_queue(dj.Username, (err) => {
                        playNextSong(() => {
                            console.log('DJ did not have a valid song. Skipping....');
                        });
                    });
                }
            }

        });

        socket.on('messageToServer', (message) => {
            let chatPayload = {
                sender: directory.getuser(socket.id).Username,
                timestamp: new Date(),
                message: message
            };
            socketManager.emit('messageFromServer', chatPayload);
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
            if (directory.getsockets(payload.to)) {
                directory.getsockets(payload.to).emit('private_message', privateMessage);
                console.log('Chat-PM: ', privateMessage.timestamp, privateMessage.sender, payload.to, privateMessage.message);
            }
        });

        socket.on('updateUserList', function () {
            updateUserList();
        });

        socket.on('leave', () => {
            let user = directory.leave(socket.id);
            if (user && user.Username && !directory.getsockets(user.Username)) {
                let username = user.Username;
                socket.broadcast.emit('user_left', username);
                console.log(username + ' left chat.');
                userinqueue[username] = false;
                let i = userQueue.indexOf(username);
                if (i >= 0) {
                    userQueue.splice(i, 1);
                    socketManager.emit('queue_updated', userQueue);
                }
            }
            updateUserList();
        });

        socket.on('disconnect', () => {
            let user = directory.disconnect(socket.id);
            if (user && user.Username && !directory.getsockets(user.Username)) {
                userinqueue[user.Username] = false;
                let i = userQueue.indexOf(user.Username);
                if (i >= 0) {
                    userQueue.splice(i, 1);
                    socketManager.emit('queue_updated', userQueue);
                }
                socket.broadcast.emit('user_left', user.Username);
                console.log(user.Username + ' left chat.');
            }
            updateUserList();
        });
    });

    return router;
};
