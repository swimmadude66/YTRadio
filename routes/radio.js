var router = require('express').Router();
var db = require('../middleware/db.js');
var uuid = require('node-uuid');
var async = require('async');

var videoqueue = [];
var userQueue = [];

var currentVideo = false;
var currDJ = null;
var FETCHING = false;
var fetchTimer = null;

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

  function playNextSong_user(){
    if(currentVideo){
      saveHistory(JSON.parse(JSON.stringify(currentVideo)));
    }
    currentVideo = false;
    if(userQueue.length>0){
      console.log('popping queue');
      currDJ = userQueue.shift();
      FETCHING=true;
      mediaManager.emit('nextSong_fetch', currDJ);
      fetchTimer = setTimeout(function(){
        console.log('request timed out, trying next user...');
        playNextSong_user();
      }, 2000);
    }
    else{
      mediaManager.emit('queue_updated', userQueue);
      mediaManager.emit('song_start', {currVid: currentVideo});
    }
  }

  function getTimeElapsed(callback){
    var now = new Date().getTime();
    if(currentVideo && now < currentVideo.EndTime){
      return callback(Math.ceil((now - currentVideo.StartTime)/1000.0));
    }
    else{
      playNextSong_user();
      //playNextSong();
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
      mediaManager.emit('queue_updated', userQueue);
      socket.emit('join', {currVid:currentVideo, startSeconds: elapsed});
    });
  });

  router.post('/fetchResponse', function(req,res){
    if(FETCHING && res.locals.usersession.Username === currDJ){
      if(fetchTimer){
        clearTimeout(fetchTimer);
      }
      var newguy = req.body;
      newguy.PlaybackID = uuid.v4();
      newguy.DJ = res.locals.usersession;
      var now = new Date().getTime();
      currentVideo = {Info: newguy, StartTime:now, EndTime: now+newguy.Duration};
      mediaManager.emit('queue_updated', userQueue);
      mediaManager.emit('song_start', {currVid: currentVideo});
      return res.send({Success:true});
    }
    else{
      return res.send({Success:false, Error:"You are not the requested DJ"});
    }
  });

  router.post('/queue', function(req, res){
    console.log(res.locals.usersession.Username, 'joined the queue');
    userQueue.push(res.locals.usersession.Username);
    mediaManager.emit('queue_updated', userQueue);
    if(!currentVideo){
      playNextSong_user();
    }
    return res.send({Success:true});
  /*
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
  */
  });

  router.delete('/queue/:username', function(req,res){
    var dmw = req.params.username;
    if(res.locals.usersession.Username === dmw || res.locals.usersession.Role === 'Admin'){
      var ind = userQueue.indexOf(dmw);
      if(ind >-1){
        var remuser = userQueue.splice(ind,1);
        console.log(remuser, 'Removed from queue');
        mediaManager.emit('queue_updated', userQueue);
        return res.send({Success:true});
      }
      else{
        return res.send({Success:false, Error: 'User not in Queue'});
      }
    }
    else{
      return res.send({Success:false, Error:'User is not authorized to alter the queue'});
    }
  });

  router.post('/skip', function(req, res){
    var skipped = false;
    if(currentVideo){
      if(res.locals.usersession.Role === 'ADMIN' || res.locals.usersession.Username === currentVideo.Info.DJ.Username){
        if(req.body.PlaybackID === currentVideo.Info.PlaybackID){
          skipped = true;
          playNextSong_user();
          //playNextSong();
        }
      }
    }
    return res.send({Success: skipped});
  });

  return router;
}
