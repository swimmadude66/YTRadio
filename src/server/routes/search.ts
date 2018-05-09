import {Router} from 'express';

module.exports = (APP_CONFIG) => {
    const router = Router();
    const ytapi = APP_CONFIG.ytapiService;

    // router.use((req, res, next) => {
    //     if (!res.locals.usersession) {
    //         return res.status(403).send('Unauthorized');
    //     } else {
    //         return next();
    //     }
    // });
    router.get('/', (req, res) => {
        if (!req.query || !req.query.q) {
            return res.status(400).send('Query is required');
        }
        let query = req.query.q;
        let host = 'https://www.googleapis.com/youtube/v3/search?part=id,snippet&maxResults=50&type=video&videoEmbeddable=true&q=';
        let req_string = host + encodeURIComponent(query) + '&key=' + APP_CONFIG.YTAPI;
        ytapi.compileResults(req_string, null, 50, (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Could not search');
            }
            let ids = '';
            let cleanvids = {};
            results.forEach((result) => {
                if (!result || !result.id || !result.id.videoId) {
                    return;
                }
                let body = {
                    ID: result.id.videoId,
                    Title: result.snippet.title,
                    Poster: result.snippet.channelTitle,
                    Thumbnails: result.snippet.thumbnails
                };
                cleanvids[body.ID] = body;
                ids += body.ID + ',';
            });
            ids = ids.substring(0, ids.length - 1);
            let qstring = 'https://www.googleapis.com/youtube/v3/videos?part=contentDetails&maxResults=50&id=' + ids + '&key=' + APP_CONFIG.YTAPI;
            ytapi.compileResults(qstring, null, 25, (error, innerresults) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send('Could not search');
                }
                ytapi.addDurations(innerresults, cleanvids, (err2, full_list) => {
                    if (err2) {
                        console.error(err2);
                        return res.status(500).send('Could not search');
                    }
                    return res.send({ videos: full_list });
                });
            });
        });
    });

    return router;
};
