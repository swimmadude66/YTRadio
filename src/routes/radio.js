var router = require('express').Router();
var directory = require('../middleware/userdirectory.js');
var db = require('../middleware/db.js');
var uuid = require('node-uuid');
var async = require('async');

var userQueue = [];
var userinqueue  = {};

var currentVideo = false;
var currDJ = null;
var FETCHING = false;
var ENDCHECKING = false;
var fetchTimer = null;

module.exports= function(io){

  var mediaManager = io.of('/media');

  function playNextSong(callback){
    if(FETCHING){
      return callback();
    }
    if(currentVideo){
      saveHistory(JSON.parse(JSON.stringify(currentVideo)));
    }
    currentVideo = false;
    if(userQueue.length>0){
      currDJ = userQueue.shift();
      var sock = directory.getsockets(currDJ);
      if(!sock || sock.length<1){
        return playNextSong(callback);
      }
      else{
        FETCHING=true;
        if(userinqueue[currDJ] && userQueue.indexOf(currDJ)<0){
          userQueue.push(currDJ);
        }
        mediaManager.emit('queue_updated', userQueue);
        mediaManager.to(sock).emit('nextSong_fetch');
        return callback();
      }
    }
    else{
      mediaManager.emit('queue_updated', userQueue);
      mediaManager.emit('song_start', {currVid: currentVideo});
      return callback();
    }
  }

  function getTimeElapsed(callback){
    var now = new Date().getTime();
    if(currentVideo && now < currentVideo.EndTime){
      return callback(Math.ceil((now - currentVideo.StartTime)/1000.0));
    }
    else{
      playNextSong(function(){
        return callback(0);
      });
    }
  }

  function saveHistory(playedSong){
    var insert = 'Insert into `History`(`PlayTime`, `DJ`, `ListenerCount`, `UpVotes`, `DownVotes`, `Saves`) VALUES(?,?,0,0,0,0);';
    db.query(insert, [playedSong.StartTime, playedSong.Info.DJ.ID], function(err, result){
      if(err){
        console.log(err);
      }
    });
  }

  mediaManager.on('connect', function(socket){
    getTimeElapsed(function(elapsed){
      mediaManager.emit('queue_updated', userQueue);
      socket.emit('join', {currVid:currentVideo, startSeconds: elapsed});
    });

    socket.on('nextSong_response', function(songdata){
      if(FETCHING){
        FETCHING=false;
        if(songdata){
          var newguy = songdata;
          newguy.PlaybackID = uuid.v4();
          newguy.DJ = directory.getuser(socket.id);
          var now = new Date().getTime();
          currentVideo = {Info: newguy, StartTime:now, EndTime: now+newguy.Duration};
          mediaManager.emit('song_start', {currVid: currentVideo});
        }
        else{
          var uiq = userQueue.indexOf(directory.getuser(socket.id));
          if(uiq >= 0){
            userQueue.splice(uiq, 1);
            socket.emit('queue_kick');
          }
          playNextSong(function(){
            console.log('DJ did not have a valid song. Skipping....');
          });
        }
      }

    });

    socket.on('leave', function(){
      var username = (directory.getuser(socket.id)||{Username:null}).Username;
      if(username){
        userinqueue[username]=false;
        var i = userQueue.indexOf(username);
        if(i>=0){
          userQueue.splice(i,1);
          mediaManager.emit('queue_updated', userQueue);
        }
      }
    });

    socket.on('disconnect', function(){
      var username = (directory.getuser(socket.id)||{Username:null}).Username;
      if(username){
        userinqueue[username]=false;
        var i = userQueue.indexOf(username);
        if(i>=0){
          userQueue.splice(i,1);
          mediaManager.emit('queue_updated', userQueue);
        }
      }
    });
  });

  router.post('/songend', function(req,res){
    if(currentVideo && currentVideo.Info.PlaybackID !== req.body.PlaybackID){
      return res.send({Success: false, Error: 'Current video does not match ID'});
    }
    if(ENDCHECKING){
      console.log('received duplicate request');
      return res.send({Success: false, Error: 'Currently processing song end'});
    }
    ENDCHECKING=true;
    getTimeElapsed(function(elapsed){
      ENDCHECKING=false;
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
      return next();
    });
  });

  router.post('/queue', function(req, res){
    if(!directory.getsockets(res.locals.usersession.Username)){
      return res.send({Success:false, Error:"No known sockets. Please Re-Login"});
    }
    else{
      userinqueue[res.locals.usersession.Username] = true;
      if(userQueue.indexOf(res.locals.usersession.Username)<0){
        userQueue.push(res.locals.usersession.Username);
        var current = userQueue.indexOf(currDJ);
        if(current>=0){
          userQueue.splice(current, 1);
          userQueue.push(currDJ);
        }
        mediaManager.emit('queue_updated', userQueue);
      }
      if(!currentVideo && !FETCHING){
        playNextSong(function(){
          return res.send({Success:true});
        });
      }
      else{
        return res.send({Success:true});
      }
    }
  });

  router.delete('/queue/:username', function(req,res){
    var dmw = req.params.username;
    if(res.locals.usersession.Username === dmw || res.locals.usersession.Role === 'ADMIN'){
      var ind = userQueue.indexOf(dmw);
      if(ind >-1){
        var remuser = userQueue.splice(ind,1);
        userinqueue[dmw]=false;
        var dmwsocket = directory.getsockets(dmw);
        if(dmwsocket){
          mediaManager.to(dmwsocket).emit('queue_kick');
        }
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
    if(currentVideo){
      if(res.locals.usersession.Role === 'ADMIN' || res.locals.usersession.Username === currentVideo.Info.DJ.Username){
        if(req.body.PlaybackID === currentVideo.Info.PlaybackID){
          playNextSong(function(){
            return res.send({Success: true});
          });
        }
        else{
          return res.send({Success: false});
        }
      }
      else{
        return res.send({Success: false});
      }
    }
    else{
      return res.send({Success: false});
    }
  });

  return router;
};
