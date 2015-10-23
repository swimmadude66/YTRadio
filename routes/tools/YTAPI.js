var request = require('request');
var async = require('async');


module.exports={
  compileResults: function (raw_string, pageToken, callback){
    var results = [];
    var more = true;
    var nextPage = pageToken;
    async.whilst(
      function(){return (results.length<25 && more)},
      function(cb){
        var search_string = raw_string;
        if(nextPage){
          search_string= raw_string+"&pageToken="+nextPage;
        }
        request(search_string, function(err, response, body){
          if(err){
            return cb(err);
          }
          else{
            var body_obj = JSON.parse(body);
            results = results.concat(body_obj.items);
            nextPage = body_obj.nextPageToken;
            more = !!nextPage;
            return cb();
          }
        });
      },
      function(err){
        if(err){
          return callback(err, results);
        }
        return callback(null, results);
      }
    );
  }
}
