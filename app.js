var express    = require('express'); 		// call express
var https      = require('https');
var http       = require('http');
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
var server;

if('SSL' in global.config){
  var config = {
    key: fs.readFileSync(global.config.SSL.keyfile),
   cert: fs.readFileSync(global.config.SSL.certfile)
  };
  server = https.createServer(config, app);
}
else{
  server = http.Server(app);
}

// SOCKET CONNECTIONS
// =============================================================================
//

// initialize sockets
var io = require('socket.io')(server);

// get media and chat socket connection managers (`/chat` and `/media` namespaces)
var chatManager = require('./config/sockets/chat.manager')(io);
var mediaManager = require('./config/sockets/media.manager')(io);


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
