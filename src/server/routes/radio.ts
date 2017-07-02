import * as uuid from 'uuid/v4';

let userQueue = [];
let userinqueue = {};

let currentVideo: any;
let currDJ;
let FETCHING = false;
let ENDCHECKING = false;

let djtimer;

module.exports = (APP_CONFIG) => {
    const router = require('express').Router();
    const db = APP_CONFIG.db;
    const directory = APP_CONFIG.userDirectory;
    const mediaManager = APP_CONFIG.Socks.of('/media');

    function playNextSong(callback) {
        if (FETCHING) {
            return callback();
        }
        if (currentVideo) {
            saveHistory(JSON.parse(JSON.stringify(currentVideo)));
        }
        currentVideo = false;
        if (userQueue.length > 0) {
            currDJ = userQueue.shift();
            let sock = directory.getsockets(currDJ);
            if (!sock || !('/media' in sock) || sock['/media'].length < 1) {
                return playNextSong(callback);
            } else {
                FETCHING = true;
                if (userinqueue[currDJ] && userQueue.indexOf(currDJ) < 0) {
                    userQueue.push(currDJ);
                }
                mediaManager.emit('queue_updated', userQueue);
                sock['/media'].emit('nextSong_fetch');
                djtimer = setTimeout(() => {
                    return playNextSong(() => console.log('Could not reach DJ in time'));
                }, 3000)
                return callback();
            }
        } else {
            mediaManager.emit('queue_updated', userQueue);
            mediaManager.emit('song_start', { currVid: currentVideo });
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

    function saveHistory(playedSong) {
        let insert = 'Insert into `History`(`PlayTime`, `DJ`, `VideoID`, `ListenerCount`, `UpVotes`, `DownVotes`, `Saves`) VALUES(?,?,?,?,0,0,0);';
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
            if (dmwsocket && dmwsocket['/media']) {
                dmwsocket['/media'].emit('queue_kick');
            }
            mediaManager.emit('queue_updated', userQueue);
            return callback();
        } else {
            return callback('User not in queue');
        }
    }

    mediaManager.on('connect', (socket) => {

        getTimeElapsed((elapsed) => {
            mediaManager.emit('queue_updated', userQueue);
            socket.emit('welcome', { currVid: currentVideo, startSeconds: elapsed });
        });

        // authenticate to become elegible to DJ
        socket.on('join', (user) => {
            directory.join(socket, user);
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
                    mediaManager.emit('song_start', { currVid: currentVideo });
                } else {
                    remove_from_queue(dj.Username, (err) => {
                        playNextSong(() => {
                            console.log('DJ did not have a valid song. Skipping....');
                        });
                    });
                }
            }

        });

        socket.on('leave', () => {
            let user = directory.leave(socket.id);
            if (user && user.Username) {
                let username = user.Username;
                userinqueue[username] = false;
                let i = userQueue.indexOf(username);
                if (i >= 0) {
                    userQueue.splice(i, 1);
                    mediaManager.emit('queue_updated', userQueue);
                }
            }
        });

        socket.on('disconnect', () => {
            let user = directory.disconnect(socket.id);
            if (user && user.Username) {
                userinqueue[user.Username] = false;
                let i = userQueue.indexOf(user.Username);
                if (i >= 0) {
                    userQueue.splice(i, 1);
                    mediaManager.emit('queue_updated', userQueue);
                }
            }
        });
    });

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
        if (!directory.getsockets(res.locals.usersession.Username)) {
            return res.status(400).send('No known sockets. Please Re-Login');
        } else {
            userinqueue[res.locals.usersession.Username] = true;
            if (userQueue.indexOf(res.locals.usersession.Username) < 0) {
                userQueue.push(res.locals.usersession.Username);
                let current = userQueue.indexOf(currDJ);
                if (current >= 0) {
                    userQueue.splice(current, 1);
                    userQueue.push(currDJ);
                }
                mediaManager.emit('queue_updated', userQueue);
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
        if (res.locals.usersession.Username === dmw || res.locals.usersession.Role === 'ADMIN') {
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
        let q = 'Select `Users`.`Username`, `Videos`.* from `History` join `Videos` on `History`.`VideoID`=`Videos`.`VideoID` join `Users` on `Users`.`ID`=`History`.`DJ` ORDER BY `History`.`ID` DESC LIMIT 25;';
        db.query(q)
        .subscribe(
            results => res.send({History: results}),
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
            if (res.locals.usersession.Role === 'ADMIN' || res.locals.usersession.Username === currentVideo.Info.DJ.Username) {
                if (req.body.PlaybackID === currentVideo.Info.PlaybackID) {
                    playNextSong(() => {
                        console.log(res.locals.usersession.Username, 'skipped the song');
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

    return router;
};
