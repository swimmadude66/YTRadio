import { Observable } from 'rxjs/Rx';
import * as async from 'async';

module.exports = (APP_CONFIG) => {
    const router = require('express').Router();
    const db = APP_CONFIG.db;
    const ytapi = APP_CONFIG.ytapiService;

    function importPlaylist(plID, callback) {
        let host = 'https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId=' + plID;
        let req_string = host + '&key=' + APP_CONFIG.YTAPI;
        ytapi.compileResults(req_string, null, -1, (err, results) => {
            if (err) {
                return callback(err);
            }
            let batches = { 0: { Count: 0, ids: '', cleanvids: {} } }; //video duration lookup only accepts 49 IDs...
            let batchnum = 0;
            results.forEach((result) => {
                if (!result.contentDetails || !result.snippet) {
                    return;
                }
                let body = {
                    ID: result.contentDetails.videoId,
                    Title: result.snippet.title,
                    Poster: result.snippet.channelTitle,
                    Thumbnails: result.snippet.thumbnails
                };
                if (batches[batchnum].Count > 48) {
                    batches[batchnum].ids = batches[batchnum].ids.substring(0, batches[batchnum].ids.length - 1);
                    batchnum++;
                    batches[batchnum] = { Count: 0, ids: '', cleanvids: {} };
                }
                batches[batchnum].ids += body.ID + ',';
                batches[batchnum].cleanvids[body.ID] = body;
                batches[batchnum].Count++;
            });
            let full_list = [];
            async.each(Object.keys(batches), (bn, cb) => {
                let qstring = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&maxResults=50&id=' + batches[bn].ids + '&key=' + APP_CONFIG.YTAPI;
                ytapi.compileResults(qstring, null, -1, (err2, innerresults) => {
                    if (err2) {
                        return cb(err2);
                    }
                    let ebvids = [];
                    innerresults.forEach((ir) => {
                        if (!ir.status || ir.status.embeddable) {
                            ebvids.push(ir);
                        }else {
                            delete batches[bn].cleanvids[ir.id];
                        }
                    });
                    ytapi.addDurations(ebvids, batches[bn].cleanvids, (err3, playlistContents) => {
                        full_list = full_list.concat(playlistContents);
                        return cb(null, playlistContents);
                    });
                });
            }, error => {
                if (error) {
                    return callback(error);
                }
                return callback(null, full_list);
            });
        });
    }

    router.use((req, res, next) => {
        if (!res.locals.usersession) {
            return res.status(401).send('Unauthorized');
        } else {
            return next();
        }
    });

    router.post('/setActive', (req, res) => {
        if (!req.body || !req.body.ID) {
            return res.status(400).send('ID is a required field');
        }
        let ID = req.body.ID;
        let sql = 'Update `playlists` SET `Active`= (`ID` = ?) where `Owner`=?;';
        db.query(sql, [ID, res.locals.usersession.ID])
            .subscribe(
            result => res.status(204).end(),
            err => {
                console.error(err);
                return res.status(500).send('Could not update playlist');
            });
    });

    router.post('/update', (req, res) => {
        let body = req.body;
        if (!body || !body.Name || !body.Contents || !body.Active) {
            return res.status(400).send('Name, Contents, and Active are required fields');
        }
        let name = body.Name;
        let contents = body.Contents;
        let active = body.Active;
        db.query('Select `ID` from `playlists` where `Name`=? and `Owner`=?', [name, res.locals.usersession.ID])
            .flatMap(results => {
                if (results.length < 1) {
                    return Observable.throw('No such playlist');
                }
                let plid = results[0].ID;
                let sql = 'Update `playlists` SET `Active`= ? where `ID`=?;';
                return db.query(sql, [active, plid])
                    .flatMap(result => {
                        let contentmap = [];
                        let i = 0;
                        contents.forEach((c) => {
                            if (!c) {
                                i++;
                                return;
                            }
                            contentmap.push([plid, c.ID, i]);
                            i++;
                        });
                        return db.query('Insert into `playlistcontents` (`PlaylistID`, `VideoID`, `Order`) VALUES ' + db.escape(contentmap) + ' ON DUPLICATE KEY UPDATE `Order`=VALUES(`Order`);');
                    });
            })
            .subscribe(
            _ => res.status(204).end(),
            err => {
                console.error(err);
                return res.status(500).send(err);
            });
    });

    router.post('/removeItem', (req, res) => {
        let body = req.body;
        if (!body || !body.PlaylistName || !body.VideoID) {
            return res.status(400).send('PlaylistName and VideoID are required fields');
        }
        let plname = body.PlaylistName;
        let vid = body.VideoID;
        db.query('Delete from `playlistcontents` where `PlaylistID`=(select ID from `playlists` where `Name`=? and `Owner`=?) and `VideoID`=?', [plname, res.locals.usersession.ID, vid])
            .subscribe(
            result => res.status(204).end(),
            err => {
                console.error(err);
                return res.status(500).send('Could not delete playlist');
            });
    });

    router.get('/', (req, res) => {
        let q = 'Select `playlists`.`ID`, `playlists`.`Name`, `playlists`.`Active`, `playlistcontents`.`Order`, `videos`.* ' +
            'from `playlists` ' +
            'left join `playlistcontents` on `playlistcontents`.`PlaylistID`=`playlists`.`ID` ' +
            'left join `videos` on `videos`.`VideoID` = `playlistcontents`.`VideoID` ' +
            'where `Owner` = ?;';
        db.query(q, [res.locals.usersession.ID])
            .map(results => {
                if (results.length < 1) {
                    return [{ Name: 'Default', Contents: [], Active: true }];
                }
                let playlists = {};
                results.forEach((result) => {
                    if (!(result.Name in playlists)) {
                        playlists[result.Name] = {
                            ID: result.ID,
                            Name: result.Name,
                            Contents: [],
                            Active: result.Active
                        };
                    }
                    let thumbs = JSON.parse(result.Thumbnails);
                    if (result.videoID) {
                        playlists[result.Name].Contents.push({ ID: result.videoID, Title: result.Title, Poster: result.Poster, Thumbnails: thumbs, FormattedTime: result.FormattedTime, Duration: result.Duration, Order: result.Order });
                    }
                });
                for (let pl in playlists) {
                    if (playlists.hasOwnProperty(pl)) {
                        playlists[pl].Contents.sort((a, b) => a.Order - b.Order);
                    }
                }
                return playlists;
            })
            .subscribe(
            playlists => res.send({ playlists: playlists }),
            err => {
                console.error(err);
                return res.status(500).send('Could not retrieve playlists');
            });
    });

    router.post('/', (req, res) => {
        if (!req.body || !req.body.Name) {
            return res.status(400).send('Name is a required field');
        }
        let sql = 'Insert into `playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?);';
        db.query(sql, [res.locals.usersession.ID, req.body.Name, JSON.stringify([]), false])
        .subscribe(
            result => res.status(204).end(),
            err => {
                console.error(err);
                return res.status(500).send('Could not create playlist');
            }
        );
    });

    router.get('/:name', (req, res) => {
        let name = req.params.name;
        let q = 'Select `playlists`.`ID`, `playlists`.`Name`, `playlists`.`Active`, `videos`.* ' +
        'from `playlists` ' +
        'join `playlistcontents` on `playlistcontents`.`PlaylistID`=`playlists`.`ID` ' +
        'join `videos` on `videos`.`VideoID` = `playlistcontents`.`VideoID` ' +
        'where `Owner` = ? AND `Name`=?;';
        db.query(q, [res.locals.usersession.ID, name])
        .subscribe(
            results => {
                if (results.length < 1) {
                    return res.send({Playlist: { Name: 'Default', Contents: [], Active: true } });
                }
                let playlists = {};
                results.forEach((result) => {
                    if (!(result.Name in playlists)) {
                        playlists[result.Name] = {
                            Name: result.Name,
                            Contents: [],
                            Active: result.Active
                        };
                    }
                    let thumbs = JSON.parse(result.Thumbnails);
                    playlists[result.Name].Contents.push({ ID: result.videoID, Title: result.Title, Poster: result.Poster, Thumbnails: thumbs, FormattedTime: result.FormattedTime, Duration: result.Duration });
                });
                for (let pl in playlists) {
                    if (playlists.hasOwnProperty(pl)) {
                        playlists[pl].Contents.sort((a, b) => a.Order - b.Order);
                    }
                }
                return res.send({ Playlist: playlists[name] });
            }, err => {
                console.error(err);
                return res.status(500).send('Could not get playlist');
            }
        );
    });

    router.delete('/:name', (req, res) => {
        let name = req.params.name;
        let contentd = 'Delete from `playlistcontents` Where playlistID=(Select ID from playlists where Name=? and Owner=?);';
        let pdelete = 'Delete from playlists where Name=? and Owner=?;';
        db.query(contentd, [name, res.locals.usersession.ID])
        .flatMap(() => db.query(pdelete, [name, res.locals.usersession.ID]))
        .subscribe(
            _ => res.status(204).end(),
            err => {
                console.error(err);
                return res.send(500).send('Could not delete playlist');
            }
        );
    });

    router.post('/import', (req, res) => {
        let body = req.body;
        if (!body || !body.Name || !body.PlaylistID) {
            return res.status(400).send('Name and PlaylistID are required fields');
        }
        let name = body.Name;
        importPlaylist(body.PlaylistID, (err, contents) => {
            if (err) {
                console.log(err);
                return res.send({ Success: false, Error: err });
            }
            let sql = 'Insert into `playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?);';
            db.query(sql, [res.locals.usersession.ID, name, JSON.stringify([]), false])
            .flatMap(
                result => {
                    let plid = result.insertId;
                    let plcontents = [];
                    let i = 0;
                    contents.forEach((c) => {
                        plcontents.push([plid, c.ID, i]);
                        i++;
                    });
                    return db.query('Insert into `playlistcontents` (`PlaylistID`, `VideoID`, `Order`) VALUES ' + db.escape(plcontents) + ' ON DUPLICATE KEY UPDATE `ID`=`ID`;');
                }
            )
            .subscribe(
                _ => res.status(204).end(),
                error => {
                    console.error(error);
                    return res.status(500).send('Could not import playlist');
                }
            );
        });
    });

    return router;
};
