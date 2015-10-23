var router = require('express').Router();
var db = require('../middleware/db.js');
var request = require('request');
var uuid = require('node-uuid');
var async = require('async');

var ytapi = require('./tools/YTAPI.js');

var videoqueue = [];

var currentVideo = false;

module.exports= function(io){

  var mediaManager = io.of('/media');

  function playNextSong(){
    if(currentVideo){
      saveHistory(JSON.parse(JSON.stringify(currentVideo)));
    }
    var now = new Date().getTime();
    currentVideo = false;
    if(videoqueue.length>0){
      var newguy = videoqueue.shift();
      newguy.PlaybackID = uuid.v4();
      currentVideo = {Info: newguy, StartTime:now, EndTime: now+newguy.Duration};
    }
    mediaManager.emit('queue_updated', videoqueue);
    mediaManager.emit('song_start', {currVid: currentVideo});
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

  function saveHistory(playedSong){
    var insert = 'Insert into `History`(`PlayTime`, `DJ`, `ListenerCount`, `UpVotes`, `DownVotes`, `Saves`) VALUES(?,?,0,0,0,0);';
    db.query(insert, [playedSong.StartTime, playedSong.Info.DJ.ID], function(err, result){
      if(err){
        console.log(err);
      }
      console.log('Saved to History');
    });
  }

  mediaManager.on('connect', function(socket){
    getTimeElapsed(function(elapsed){
      mediaManager.emit('queue_updated', videoqueue);
      socket.emit('join', {currVid:currentVideo, startSeconds: elapsed});
    });
  });

  router.get('/search/:query', function(req, res){
    var host = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=video&videoEmbeddable=true&q=";
    var req_string = host + req.params.query+"&key="+global.config.Keys.YoutubeAPI;
    ytapi.compileResults(req_string, null, function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      var ids = "";
      var cleanvids = {};
      results.forEach(function(result){
        var body = {
          ID: result.id.videoId,
          Title: result.snippet.title,
          Poster: result.snippet.channelTitle,
          Thumbnails: result.snippet.thumbnails
        };
        cleanvids[body.ID] = body;
        ids += body.ID+",";
      });
      ids = ids.substring(0,ids.length-1);
      var qstring = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+ids+"&key="+global.config.Keys.YoutubeAPI;
      ytapi.compileResults(qstring, null, function(err, innerresults){
        if(err){
          console.log(err);
          return res.send({Success: false, Error: err});
        }
        var full_list = [];
        innerresults.forEach(function(ir){
          var duration = ir.contentDetails.duration;
          var durationparts = duration.replace(/P(\d+D)?T(\d+H)?(\d+M)?(\d+S)/i, "$1, $2, $3, $4").split(/\s*,\s*/i);
          var durationmillis = 0;
          var mults = [1000, 60000, 60*60000, 24*60*60000];
          for(var i=durationparts.length-1; i>=0; i--){
            durationmillis += parseInt(durationparts[i].substring(0,durationparts[i].length-1)*mults[3-i]);
          }
          cleanvids[ir.id].Duration = durationmillis;
          var minutes = Math.floor((durationmillis/1000)/60);
          var seconds = (durationmillis/1000)%60;
          var normtime = "";
          if(minutes>60){
            normtime = Math.floor(minutes/60) +":"
            minutes = minutes%60;
            if(minutes < 10){
              minutes = "0"+minutes;
            }
          }
          normtime += minutes + ":";
          if(seconds < 10){
            normtime += "0";
          }
          normtime += seconds;
          cleanvids[ir.id].FormattedTime = normtime;
          full_list.push(cleanvids[ir.id]);
        });
        return res.send({Success:true, Videos:full_list});
      });
    });
  });

  router.post('/queue/', function(req, res){
    var videoinfo = req.body;
    if(!videoinfo){
      return res.send({Success:false, Error: "No video info included"});
    }
    videoinfo.DJ = res.locals.usersession;
    videoqueue.push(videoinfo);
    if(!currentVideo){
      playNextSong();
    }
    mediaManager.emit('queue_updated', videoqueue);
    return res.send({Success:true});
  });

  router.post('/songend', function(req,res){
    getTimeElapsed(function(elapsed){
      return res.send({Success:true});
    });
  });

  router.post('/skip', function(req, res){
    var skipped = false;
    if(currentVideo){
      if(res.locals.usersession.Role === 'ADMIN' || res.locals.usersession.Username === currentVideo.Info.DJ.Username){
        if(req.body.PlaybackID === currentVideo.Info.PlaybackID){
          skipped = true;
          playNextSong();
        }
      }
    }
    return res.send({Success: skipped});
  });

  return router;
}
