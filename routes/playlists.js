var router = require('express').Router();
var db = require('../middleware/db.js');
var async = require('async');
var ytapi = require('./tools/YTAPI.js');

module.exports= function(io){

  function importPlaylist(plID, callback){
    var host = "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&maxResults=50&playlistId="+plID;
    var req_string = host +"&key="+global.config.Keys.YoutubeAPI;
    ytapi.compileResults(req_string, null, -1, function(err, results){
      if(err){
        return callback(err);
      }
      var ids = "";

      var batches = {0:{Count:0, ids:"", cleanvids:{}}}; //video duration lookup only accepts 49 IDs...
      var batchnum = 0;
      results.forEach(function(result){
        if(!result.contentDetails || !result.snippet){
          return;
        }
        var body = {
          ID: result.contentDetails.videoId,
          Title: result.snippet.title,
          Poster: result.snippet.channelTitle,
          Thumbnails: result.snippet.thumbnails
        };
        if(batches[batchnum].Count>48){
          batches[batchnum].ids = batches[batchnum].ids.substring(0,batches[batchnum].ids.length-1);
          batchnum++;
          batches[batchnum]={Count:0, ids:"", cleanvids:{}};
        }
        batches[batchnum].ids += body.ID+",";
        batches[batchnum].cleanvids[body.ID] = body;
        batches[batchnum].Count ++;
      });
      var full_list = [];
      async.each(Object.keys(batches), function(bn, cb){
        var qstring = "https://www.googleapis.com/youtube/v3/videos?part=contentDetails,status&maxResults=50&id="+batches[bn].ids+"&key="+global.config.Keys.YoutubeAPI;
        ytapi.compileResults(qstring, null, -1, function(err, innerresults){
          if(err){
            return cb(err);
          }
          var ebvids = []
          innerresults.forEach(function(ir){
            if(!ir.status || ir.status.embeddable){
              ebvids.push(ir);
            }
            else{
              delete batches[bn].cleanvids[ir.id];
            }
          });
          ytapi.addDurations(ebvids, batches[bn].cleanvids, function(err, playlistContents){
            full_list=full_list.concat(playlistContents);
            return cb(null, playlistContents);
          });
        });
      }, function(err){
        if(err){
          return callback(err);
        }
        return callback(null, full_list);
      });
    });
  }

  router.post('/update', function(req,res){
    var name = req.body.Name;
    var contents = req.body.Contents;
    var active = req.body.Active;
    var sql = "Insert into `Playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `ContentsJSON` = VALUES(`ContentsJSON`), `Active`=VALUES(`Active`);"
    db.query(sql, [res.locals.usersession.ID, name, JSON.stringify(contents), active], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success: true});
    });
  });

  router.get('/', function(req, res){
    db.query('Select * from `Playlists` where Owner = ?;', [res.locals.usersession.ID], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length < 1){
        return res.send({Success: true, Playlists: {Default: {Name: "Default", Contents:[], Active:true}}});
      }
      var playlists = {};
      results.forEach(function(result){
        playlists[result.Name] = {
          Name: result.Name,
          Contents: JSON.parse(result.ContentsJSON),
          Active: result.Active
        }
      });
      return res.send({Success: true, Playlists: playlists});
    });
  });

  router.get('/:name', function(req, res){
    var name = req.params.name;
    db.query('Select * from `Playlists` where `Owner` = ? AND `Name`=?;', [res.locals.usersession.ID, name], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length < 1){
        return res.send({Success: true, Playlist: {Name: "Default", Contents:[], Active:true}});
      }
      var result = results[0];
      var playlist = {
        Name: result.Name,
        Contents: JSON.parse(result.ContentsJSON),
        Active: result.Active
      }
      return res.send({Success: true, Playlist: playlist});
    });
  });

  router.delete('/:name', function(req, res){
    var name = req.params.name;
    db.query('Delete from `Playlists` where `Name`=? AND `Owner`=?;', [name, res.locals.usersession.ID], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success: true});
    });
  });

  router.post('/import', function(req, res){
    var name = req.body.Name;
    importPlaylist(req.body.PlaylistID, function(err, contents){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      var sql = "Insert into `Playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `ContentsJSON` = VALUES(`ContentsJSON`);"
      db.query(sql, [res.locals.usersession.ID, name, JSON.stringify(contents), false], function(err, result){
        if(err){
          console.log(err);
          return res.send({Success: false, Error: err});
        }
        return res.send({Success: true});
      });
    });

  });

  return router;
}
