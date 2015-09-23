var router = require('express').Router();
var request = require('request');

var videoqueue = [];

var currentVideo = false;

module.exports= function(io){

  io.on('connect', function(socket){
    console.log(currentVideo);
    if(currentVideo){
      //send currentID and time in to video
    }
    else{
      currentVideo = {Info: videoqueue[0], StartTime:new Date().getTime()};
      io.sockets.emit('song_start', currentVideo);
    }
  });

  io.on('song_end', function(data){
    console.log('song ended');
    videoqueue.splice(0,1);
    io.sockets.emit('queue_updated', videoqueue);
    if(videoqueue.length>0){
      currentVideo = videoqueue[0];
      currentVideo = {Info: videoqueue[0], StartTime:new Date().getTime()};
      io.sockets.emit('song_start', currentVideo);
    }
    else{
      currentVideo = false;
    }
  });

  router.get('/search/:query', function(req, res){
    var host = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=video&q=";
    var req_string = host + req.params.query+"&key="+global.config.Keys.YoutubeAPI;
    request(req_string, function(err, response, body){
      if(err){
        return res.send({Success:false, Error: err});
      }
      else{
        var body_obj = JSON.parse(body);
        return res.send({Success:true, Videos:body_obj.items});
      }
    });
  });

  router.post('/queue/', function(req, res){
    var videoinfo = req.body;
    if(!videoinfo){
      return res.send({Success:false, Error: "No video info included"});
    }
    var id = videoinfo['id'].videoId;
    var qstring = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id="+id+"&key="+global.config.Keys.YoutubeAPI;
    request(qstring, function(err, response, body){
      if(err){
        return res.send({Success:false, Error: err});
      }
      else{
        var body_obj = JSON.parse(body);
        var duration = body_obj.items[0].contentDetails.duration;
        var durationparts = duration.replace(/P(\d*)D?T(\d*)H?(\d*)M?(\d+)S/i, "$1, $2, $3, $4").split(/\s*,\s*/i);
        var durationmillis = 0;
        var mults = [1000, 60000, 60*60000, 24*60*60000];
        for(var i=durationparts.length-1; i>=0; i--){
          durationmillis += parseInt(durationparts[i]*mults[3-i]);
        }
        videoinfo.Duration = durationmillis;
        videoqueue.push(videoinfo);
        io.sockets.emit('queue_updated', videoqueue);
        currentVideo = {Info: videoqueue[0], StartTime:new Date().getTime()};
        io.sockets.emit('song_start', currentVideo);
        return res.send({Success:true});
      }
    });
  });

  return router;
}
