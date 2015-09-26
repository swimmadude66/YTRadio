var router = require('express').Router();
var db = require('../middleware/db.js');
var encryption = require('../middleware/encryption.js');
var uuid = require('node-uuid');
module.exports= function(io){

/*
  io.on('connect', function(socket){
    socket.join('radio');
    socket.on('loggedin', function(){
      socket.join('chat');
    });
    socket.on('loggedout', function(){
      socket.leave('chat');
    });
  });
*/
  function gen_session(user, callback){
    var sid = uuid.v4();
    var session_block = {
      Key: sid,
      User: user,
      Expires: new Date().getTime() + 6*60*60*1000
    };
    db.query('Insert into Sessions (Key, UserID, Expires) Values(?,?,?)', [session_block.Key, session_block.User.ID, session_block.Expires], function(err, result){
      if(err){
        return callback(err);
      }
      return callback(null, session_block);
    });
  }

  /*
  * Public Methods
  */
  router.post('/signup', function(req, res){
    var username = req.body.Username;
    var email = req.body.Email;
    var pass = req.body.Password;
    var salt = uuid.v4();
    var encpass = encryption.encrypt(salt+"|"+pass);
    var confirm = uuid.v4();
    db.query('Insert into users(Username, Email, Password, Confirm)', [username, email, encpass, confirm], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      //send email;
      return res.send({Success: true, Message: "Confirmation email sent."});
    });
  });

  router.get('/verification/:v_key', function(req, res){
    db.query('Update users set Active=1 where Confirm=?', [req.params.v_key], function(err, res){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      return res.send({Success: true});
    });
  });

  router.post('/login', function(req, res){
    var username = req.body.Username;
    var pass = req.body.Password;
    db.query('Select * from users where Username = ?', [username], function(err, results){
      if(err){
        console.log(err);
        return res.send({Success: false, Error: err});
      }
      if(results.length<1){
        return res.send({Success:false, Error:"No such username"});
      }
      var user = results[0];
      var validpass = (encryption.encrypt(user.Salt+"|"+pass) === user.password);
      if(validpass){
        var public_user = {ID: user.ID, Username: user.Username, Role:user.Role};
        gen_session(public_user, function(err, session){
          if(err){
            console.log(err);
            return res.send({Success: false, Error: err});
          }
          return res.send({Success: true, Session:session});
        });
      }
      return res.send({Success: false, Error: err});
    });
  });


  /*
  * Authentication gateway
  */

  /*
  * External Methods
  */
  router.use('/radio/', require('./radio.js')(io));

  return router;
}
