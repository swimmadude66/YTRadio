var router = require('express').Router();
var request = require('request');
var async = require('async');

var videoqueue = [];

var currentVideo = false;

module.exports= function(io){

  var mediaManager = io.of('/media');

  function playNextSong(){
    var now = new Date().getTime();
    currentVideo = false;
    if(videoqueue.length>0){
      var newguy = videoqueue.shift();
      currentVideo = {Info: newguy, StartTime:now, EndTime: now+newguy.Duration};
    }
    mediaManager.emit('song_start', {currVid: currentVideo, videoQueue: videoqueue});
  }

  function getTimeElapsed(callback){
    var now = new Date().getTime();
    if(currentVideo && now < currentVideo.EndTime){
      return callback(Math.ceil((now - currentVideo.StartTime)/1000.0));
    }
    else{
      playNextSong();
    }
    return callback(0);
  }

  function compileResults(raw_string, pageToken, callback){
    var results = [];
    var more = true;
    var nextPage = pageToken;
    async.whilst(
      function(){return (results.length<25 && more)},
      function(cb){
        var search_string = raw_string;
        if(nextPage){
          search_string= raw_string+"&pageToken="+nextPage;
        }
        request(search_string, function(err, response, body){
          if(err){
            return cb(err);
          }
          else{
            var body_obj = JSON.parse(body);
            results = results.concat(body_obj.items);
            nextPage = body_obj.nextPageToken;
            more = !!nextPage;
            return cb();
          }
        });
      },
      function(err){
          //maybe filter out the data here?
        if(err){
          return callback(err, results);
        }
        return callback(null, results);
      }
    );
  }

  mediaManager.on('connect', function(socket){
    getTimeElapsed(function(elapsed){
      socket.emit('join', {videoQueue:videoqueue, currVid:currentVideo, startSeconds: elapsed});
    });
  });

  router.get('/search/:query', function(req, res){
    var host = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=video&videoEmbeddable=true&q=";
    var req_string = host + req.params.query+"&key="+global.config.Keys.YoutubeAPI;
    compileResults(req_string, null, function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success:true, Videos:results});
    });
  });

  router.post('/queue/', function(req, res){
    var videoinfo = req.body;
    if(!videoinfo){
      return res.send({Success:false, Error: "No video info included"});
    }
    var id = videoinfo.id.videoId;
    var qstring = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+id+"&key="+global.config.Keys.YoutubeAPI;
    request(qstring, function(err, response, body){
      if(err){
        return res.send({Success:false, Error: err});
      }
      else{
        var body_obj = JSON.parse(body);
        var duration = body_obj.items[0].contentDetails.duration;
        var durationparts = duration.replace(/P(\d+D)?T(\d+H)?(\d+M)?(\d+S)/i, "$1, $2, $3, $4").split(/\s*,\s*/i);
        var durationmillis = 0;
        var mults = [1000, 60000, 60*60000, 24*60*60000];
        for(var i=durationparts.length-1; i>=0; i--){
          durationmillis += parseInt(durationparts[i].substring(0,durationparts[i].length-1)*mults[3-i]);
        }
        videoinfo.Duration = durationmillis;
        videoqueue.push(videoinfo);
        if(!currentVideo){
          playNextSong();
        }
        else{
          mediaManager.emit('queue_updated', videoqueue);
        }
        return res.send({Success:true});
      }
    });
  });

  router.post('/songend', function(req,res){
    getTimeElapsed(function(elapsed){
      return res.send({Success:true});
    });
  });

  router.post('/skip', function(req, res){
    var skipped = false;
    if(req.body.videoID === currentVideo.Info.id.videoId){
      skipped = true;
      playNextSong();
    }
    return res.send({Success: skipped});
  });

  return router;
}
