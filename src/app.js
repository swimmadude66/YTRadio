var express    = require('express'); 		// call express
var bodyParser = require('body-parser');
var path       = require('path');
var compress   = require('compression');
global.config  = require('./config.json');
var app        = express(); 			// define our app using express

app.use(compress());
app.set('view engine','html');
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname, 'client')));
app.set('views', __dirname + '/client/views');
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

var httpport = 80;
var httpsport = 443;
var server;
var isHTTPS = false;

if('SSL' in global.config){
  var fs = require('fs');
  var config = {
    key: fs.readFileSync(global.config.SSL.keyfile),
   cert: fs.readFileSync(global.config.SSL.certfile),
   ca: fs.readFileSync(global.config.SSL.chainfile)
  };
  var https = require('https');
  server = https.createServer(config, app);
  isHTTPS = true;
}
else{
  var http = require('http');
  server = http.Server(app);
}
var port = (isHTTPS ? httpsport : httpport);

// SOCKET CONNECTIONS
// =============================================================================
//

// initialize sockets
var io = require('socket.io')(server);

// ROUTES FOR OUR API
// =============================================================================
//

app.get('/', function(req, res){
  res.render('index');
});

var api = require('./routes/api.js')(io);
app.use('/api/', api);

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


// STARTUP THE SERVER
// =============================================================================
//
server.listen(port);
console.log('Magic happens on port ' + port);
