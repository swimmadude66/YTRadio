var router = require('express').Router();
var db = require('../middleware/db.js');
var encryption = require('../middleware/encryption.js');
var uuid = require('node-uuid');
module.exports= function(io){

  /*
  * Public Methods
  */
  //TODO: implement login
  router.post('/login', function(req, res){
    var username = req.body.Username;
    var pass = req.body.Password;
    db.query('Select * from users where username = ?', [username], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length<1){
        return res.send({Success:false, Error:"No such username"});
      }
      var user = results[0];
      
    });
  });

  //TODO: implement signup

  /*
  * Authentication gateway
  */

  /*
  * External Methods
  */
  router.use('/radio/', require('./radio.js')(io));

  return router;
}
