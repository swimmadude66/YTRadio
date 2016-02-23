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
          var ebvids = [];
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

  router.post('/setActive', function(req, res){
    var ID = req.body.ID;
    var sql = "Update `Playlists` SET `Active`= (`ID` = ?) where `Owner`=?;";
    db.query(sql, [ID, res.locals.usersession.ID], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success:true});
    });
  });

  router.post('/update', function(req,res){
    var name = req.body.Name;
    var contents = req.body.Contents;
    var active = req.body.Active;
    db.query('Select ID from `Playlists` where `Name`=? and `Owner`=?', [name, res.locals.usersession.ID], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length<1){
        return res.send({Success: false, Error: 'No such playlist'});
      }
      var plid = results[0].ID;
      var sql = "Update `Playlists` SET `Active`= ? where `ID`=?;";
      db.query(sql, [active, plid], function(err, result){
        if(err){
          console.log(err);
          return res.send({Success: false, Error: err});
        }
        var contentmap = [];
        var i =0;
        contents.forEach(function(c){
          if(!c){
            i++;
            return;
          }
          contentmap.push([plid, c.ID, i]);
          i++;
        });
        db.query('Insert into `playlistcontents` (`PlaylistID`, `VideoID`, `Order`) VALUES ' + db.escape(contentmap) +' ON DUPLICATE KEY UPDATE `Order`=VALUES(`Order`);', function(err, result2){
          if(err){
            console.log(err);
            return res.send({Success: false, Error: err});
          }
          return res.send({Success: true});
        });
      });
    });
  });

  router.post('/removeItem', function(req, res){
    var plname = req.body.PlaylistName;
    var vid = req.body.VideoID;
    db.query('Delete from `playlistcontents` where `PlaylistID`=(select ID from `playlists` where `Name`=? and `Owner`=?) and `VideoID`=?', [plname, res.locals.usersession.ID, vid], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success:true});
    });
  });

  router.get('/', function(req, res){
    db.query('Select `Playlists`.`ID`, `Playlists`.`Name`, `Playlists`.`Active`, `playlistcontents`.`Order`, `videos`.* from `Playlists` left join `playlistcontents` on `playlistcontents`.`PlaylistID`=`Playlists`.`ID` left join `videos` on `videos`.`VideoID` = `playlistcontents`.`VideoID` where `Owner` = ?;', [res.locals.usersession.ID], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length < 1){
        return res.send({Success: true, Playlists: {Default: {Name: "Default", Contents:[], Active:true}}});
      }
      var playlists = {};
      results.forEach(function(result){
        if(!(result.Name in playlists)){
          playlists[result.Name] = {
            ID: result.ID,
            Name: result.Name,
            Contents: [],
            Active: result.Active
          };
        }
        var thumbs = JSON.parse(result.Thumbnails);
        if(result.videoID){
          playlists[result.Name].Contents.push({ID:result.videoID, Title: result.Title, Poster: result.Poster, Thumbnails:thumbs, FormattedTime:result.FormattedTime, Duration:result.Duration, Order: result.Order});
        }
      });
      for(var pl in playlists){
        playlists[pl].Contents.sort((a,b)=>a.Order-b.Order);
      }
      return res.send({Success: true, Playlists: playlists});
    });
  });

  router.post('/', function(req, res){
    var sql = "Insert into `Playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?);";
    db.query(sql, [res.locals.usersession.ID, req.body.Name, JSON.stringify([]), false], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success:true});
    });
  });

  router.get('/:name', function(req, res){
    var name = req.params.name;
    db.query('Select `Playlists`.`ID`, `Playlists`.`Name`, `Playlists`.`Active`, `videos`.* from `Playlists` join `playlistcontents` on `playlistcontents`.`PlaylistID`=`Playlists`.`ID` join `videos` on `videos`.`VideoID` = `playlistcontents`.`VideoID` where `Owner` = ? AND `Name`=?;', [res.locals.usersession.ID, name], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length < 1){
        return res.send({Success: true, Playlist: {Name: "Default", Contents:[], Active:true}});
      }
      var playlists = {};
      results.forEach(function(result){
        if(!(result.Name in playlists)){
          playlists[result.Name] = {
            Name: result.Name,
            Contents: [],
            Active: result.Active
          };
        }
        var thumbs = JSON.parse(result.Thumbnails);
        playlists[result.Name].Contents.push({ID:result.videoID, Title: result.Title, Poster: result.Poster, Thumbnails:thumbs, FormattedTime:result.FormattedTime, Duration:result.Duration});
      });
      for(var pl in playlists){
        playlists[pl].Contents.sort((a,b)=>a.Order-b.Order);
      }
      return res.send({Success: true, Playlist: playlists[name]});
    });
  });

  router.delete('/:name', function(req, res){
    var name = req.params.name;
    var contentd = 'Delete from `playlistcontents` Where playlistID=(Select ID from playlists where Name=? and Owner=?);';
    var pdelete = 'Delete from playlists where Name=? and Owner=?;';
    db.query(contentd, [name, res.locals.usersession.ID], function(err, result){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      db.query(pdelete, [name, res.locals.usersession.ID], function(err, result2){
        if(err){
          console.log(err);
          return res.send({Success: false, Error: err});
        }
        return res.send({Success: true});
      });
    });
  });

  router.post('/import', function(req, res){
    var name = req.body.Name;
    importPlaylist(req.body.PlaylistID, function(err, contents){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      var sql = "Insert into `Playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?);";
      db.query(sql, [res.locals.usersession.ID, name, JSON.stringify([]), false], function(err, result){
        if(err){
          console.log(err);
          return res.send({Success: false, Error: err});
        }
        var plid = result.insertId;
        var plcontents = [];
        var i =0;
        contents.forEach(function(c){
          plcontents.push([plid, c.ID, i]);
          i++;
        });
        db.query('Insert into `playlistcontents` (`PlaylistID`, `VideoID`, `Order`) VALUES ' + db.escape(plcontents) + ' ON DUPLICATE KEY UPDATE `ID`=`ID`;', function(err, result2){
          if(err){
            console.log(err);
            return res.send({Success: false, Error: err});
          }
          return res.send({Success: true});
        });
      });
    });
  });

  return router;
};
