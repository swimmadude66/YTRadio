import {Database} from './db';
import { RxHttpRequest as request } from 'rx-http-request';
import * as async from 'async';

export class YTAPI {

    private db: Database;

    constructor (database: Database) {
        this.db = database;
    }

    compileResults(raw_string, pageToken, maxResults, callback) {
        let results = [];
        let more = true;
        let nextPage = pageToken;
        async.whilst(
            () => {
                if (maxResults > 0) {
                    return (results.length < maxResults && more);
                } else {
                    return (more);
                }
            },
            (cb) => {
                let search_string = raw_string;
                if (nextPage) {
                    search_string = `${raw_string}&pageToken=${nextPage}`;
                }
                let options = {
                    headers: {
                        'Accept': 'application/json'
                    }
                };
                request.get(search_string, options)
                .subscribe(
                    data => {
                        try {
                            let body = JSON.parse(data.body);
                            results = results.concat(body.items);
                            nextPage = body.nextPageToken;
                            more = !!nextPage;
                            return cb();
                        } catch (e) {
                            return cb(e);
                        }
                    },
                    err => cb(err)
                );
            },
            (err) => {
                if (err) {
                    return callback(err, results);
                }
                return callback(null, results);
            }
        );
    }

    addDurations(videos, cleanvids, callback) {
        let full_list = [];
        videos.forEach((ir) => {
            if (!ir.contentDetails || !ir.contentDetails.duration) {
                delete cleanvids[ir.id];
                return;
            }
            let duration = ir.contentDetails.duration;
            let durationparts = duration.replace(/P(\d+D)?T(\d+H)?(\d+M)?(\d+S)?/i, '$1, $2, $3, $4').split(/\s*,\s*/i);
            let durationmillis = 0;
            let mults = [1000, 60000, 60 * 60000, 24 * 60 * 60000];
            for (let i = durationparts.length - 1; i >= 0; i--) {
                let portion = durationparts[i];
                let format = ((portion.length > 1) ? parseInt(portion.substring(0, durationparts[i].length - 1), 10) : 0);
                durationmillis +=  format * mults[3 - i];
            }
            cleanvids[ir.id].Duration = durationmillis;
            let minutes = Math.floor((durationmillis / 1000) / 60);
            let seconds = (durationmillis / 1000) % 60;
            let normtime = '';
            if (minutes > 60) {
                normtime = Math.floor(minutes / 60) + ':';
                minutes = minutes % 60;
                if (minutes < 10) {
                    normtime += '0';
                }
            }
            normtime += minutes + ':';
            if (seconds < 10) {
                normtime += '0';
            }
            normtime += seconds;
            cleanvids[ir.id].FormattedTime = normtime;
            full_list.push(cleanvids[ir.id]);
        });
        let nestedlists = full_list
        .map(
            x => [x.ID, x.Title, x.Poster, JSON.stringify(x.Thumbnails || {default: {url: 'images/nothumbnail.jpg'}}), x.FormattedTime, x.Duration]
        );
        if (nestedlists.length < 1) {
            return callback('No Songs mapped');
        }
        let song_collate = 'INSERT INTO `videos` (`videoID`, `Title`, `Poster`, `Thumbnails`, `FormattedTime`, `Duration`) VALUES ' + this.db.escape(nestedlists) + ' ON DUPLICATE KEY UPDATE `videoID`=`videoID`;';
        this.db.query(song_collate)
        .subscribe(
            _ => {
                return callback(null, full_list);
            },
            err => {
                console.error(err);
                return callback(err);
            }
        );
    }

}
