var db = require('../../middleware/db.js');
var request = require('request');
var async = require('async');

module.exports={
  compileResults: function (raw_string, pageToken, maxResults, callback){
    var results = [];
    var more = true;
    var nextPage = pageToken;
    async.whilst(
      function(){
        if(maxResults > 0){
          return (results.length<maxResults && more);
        }
        else{
          return (more);
        }
      },
      function(cb){
        var search_string = raw_string;
        if(nextPage){
          search_string= raw_string+"&pageToken="+nextPage;
        }
        var options={
          url: search_string,
          header:{
            'Accept':'application/json'
          }
        };
        request(options, function(err, response, body){
          if(err){
            return cb(err);
          }
          else{
            try{
              var body_obj = JSON.parse(body);
            }
            catch(e){
              return cb(e);
            }
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
  },
  addDurations: function(videos, cleanvids, callback){
    var full_list = [];
    videos.forEach(function(ir){
      if(!ir.contentDetails || !ir.contentDetails.duration){
        delete cleanvids[ir.id];
        return
      }
      var duration = ir.contentDetails.duration;
      var durationparts = duration.replace(/P(\d+D)?T(\d+H)?(\d+M)?(\d+S)?/i, "$1, $2, $3, $4").split(/\s*,\s*/i);
      var durationmillis = 0;
      var mults = [1000, 60000, 60*60000, 24*60*60000];
      for(var i=durationparts.length-1; i>=0; i--){
        durationmillis += parseInt(durationparts[i].substring(0,durationparts[i].length-1)*mults[3-i]);
      }
      cleanvids[ir.id].Duration = durationmillis;
      var minutes = Math.floor((durationmillis/1000)/60);
      var seconds = (durationmillis/1000)%60;
      var normtime = "";
      if(minutes>60){
        normtime = Math.floor(minutes/60) +":"
        minutes = minutes%60;
        if(minutes < 10){
          minutes = "0"+minutes;
        }
      }
      normtime += minutes + ":";
      if(seconds < 10){
        normtime += "0";
      }
      normtime += seconds;
      cleanvids[ir.id].FormattedTime = normtime;
      full_list.push(cleanvids[ir.id]);
    });
    var nestedlists = full_list.map(x => [x.ID, x.Title, x.Poster, JSON.stringify(x.Thumbnails || {default:{url:"images/nothumbnail.jpg"}}), x.FormattedTime, x.Duration]);
    if(nestedlists.length<1){
      return callback('No Songs mapped');
    }
    var song_collate = "INSERT INTO `videos` (`videoID`, `Title`, `Poster`, `Thumbnails`, `FormattedTime`, `Duration`) VALUES " + db.escape(nestedlists) + " ON DUPLICATE KEY UPDATE `videoID`=`videoID`;"
    db.query(song_collate, function(err, result){
      if(err){
        console.log(err);
      }
    });
    return callback(null, full_list);
  }
}
