var router = require('express').Router();
var db = require('../middleware/db.js');
var uuid = require('node-uuid');
var async = require('async');

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
