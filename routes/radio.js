var router = require('express').Router();
var db = require('../middleware/db.js');
var uuid = require('node-uuid');
var async = require('async');

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
    currentVideo = false;
    if(userQueue.length>0){
      currDJ = userQueue.shift();
      FETCHING=true;
      mediaManager.emit('nextSong_fetch', currDJ);
      fetchTimer = setTimeout(function(){
        console.log('request timed out, trying next user...');
        playNextSong();
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
      mediaManager.emit('queue_updated', userQueue);
      socket.emit('join', {currVid:currentVideo, startSeconds: elapsed});
    });
  });

  router.post('/songend', function(req,res){
    getTimeElapsed(function(elapsed){
      return res.send({Success:true});
    });
  });

  router.use(function(req, res, next){
    var authZ = req.headers.Authorization || req.headers.authorization;
    if(!authZ){
      return res.send({Success:false, Error:"No valid Auth token"});
    }
    var keylookup = 'Select Users.`Username`, Users.`ID`, Users.`Role`, Sessions.`Key` from Sessions join Users on Sessions.`UserID` = Users.`ID` Where Sessions.`Active`=1 AND Sessions.`Key`=?;';
    db.query(keylookup, [authZ], function(err, results){
      if(err){
        return res.send({Success: false, Error: err});
      }
      if(!results || results.length <1){
        return res.send({Success: false, Error: "Invalid Auth!"});
      }
      var user=results[0];
      res.locals.usersession = user;
      next();
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
      playNextSong();
    }
    return res.send({Success:true});
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
          playNextSong();
        }
      }
    }
    return res.send({Success: skipped});
  });

  return router;
}
