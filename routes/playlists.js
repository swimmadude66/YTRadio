var router = require('express').Router();
var db = require('../middleware/db.js');
var async = require('async');

module.exports= function(io){

  router.post('/update', function(req,res){
    var name = req.body.Name;
    var contents = req.body.Contents;
    var active = req.body.Active;
    var sql = "Insert into `Playlists` (`Owner`, `Name`, `ContentsJSON`, `Active`) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `ContentsJSON` = VALUES(`ContentsJSON`);"
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

  return router;
}
