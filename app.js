var express    = require('express'); 		// call express
var https      = require('https');
var fs         = require('fs');
var bodyParser = require('body-parser');
var path       = require('path');
global.config  = require('./config.json');
var app        = express(); 			// define our app using express


app.set('view engine','html');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'client')));
app.set('views', __dirname + '/client/views');
app.use(bodyParser.json())

var port = 3000;

// ROUTES FOR OUR API
// =============================================================================
//

app.get('/', function(req, res){
  res.render('index');
});

//app.use('/api/', require('./routes/api.js'));

var videos = ["CXPADwU05OQ", "BjsjIkSb0cM", "b4taIpALfAo", "sWir8bPu7kI", "FHxH0kkXWpY", "rx4xblzpkgs"];
var count = 0;

app.get('/api/nextvideo', function(req, res, next){
  var vid = videos[count%videos.length];
  count ++;
  return res.send({Success:true, vidID: vid});
});


//keep this last, as it will return 404
app.use(function(req, res, next){
  res.status(404);
  // respond with html page
  if (req.accepts('html')) {
    return res.render('404', { url: req.url });
  }
  // respond with json
  if (req.accepts('json')) {
    return res.send({error: 'Not a valid endpoint'});
  }
  // default to plain-text. send()
  return res.type('txt').send('Not found');
});

if('SSL' in global.config){
  var config = {
    key: fs.readFileSync(global.config.SSL.keyfile),
   cert: fs.readFileSync(global.config.SSL.certfile)
  };
  https.createServer(config, app).listen(port);
}
else{
  app.listen(port);
}
console.log('Magic happens on port ' + port);
