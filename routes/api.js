var router = require('express').Router();

module.exports= function(io){

  /*
  * Public Methods
  */
  //TODO: implement login
  router.post('/login', function(req, res){

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
