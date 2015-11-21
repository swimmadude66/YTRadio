var router = require('express').Router();
var request = require('request');
var ytapi = require('./tools/YTAPI.js');

router.get('/:query', function(req, res){
  var host = "https://www.googleapis.com/youtube/v3/search?part=id,snippet&maxResults=50&type=video&videoEmbeddable=true&q=";
  var req_string = host + req.params.query+"&key="+global.config.Keys.YoutubeAPI;
  ytapi.compileResults(req_string, null, 50, function(err, results){
    if(err){
      console.log(err);
      return res.send({Success: false, Error: err});
    }
    var ids = "";
    var cleanvids = {};
    results.forEach(function(result){
      if(!result || !result.id || !result.id.videoId){
        return
      }
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
    var qstring = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails&maxResults=50&id="+ids+"&key="+global.config.Keys.YoutubeAPI;
    ytapi.compileResults(qstring, null, 25, function(err, innerresults){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      ytapi.addDurations(innerresults, cleanvids, function(err, full_list){        
        return res.send({Success:true, Videos:full_list});
      });
    });
  });
});

module.exports=router;
