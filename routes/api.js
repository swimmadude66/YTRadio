var router = require('express').Router;

  var videos = ["CXPADwU05OQ", "BjsjIkSb0cM", "b4taIpALfAo", "sWir8bPu7kI", "FHxH0kkXWpY", "rx4xblzpkgs"];
  var count = 0;

router.get('/nextvideo', function(req, res, next){
  var vid = videos[count];
  count ++;
  return res.send({Success:true, vidID: vid});
});

module.exports= router;
