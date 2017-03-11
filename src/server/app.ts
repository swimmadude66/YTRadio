import {UserDirectory} from './services/userdirectory';
import {join} from 'path';
import {readFileSync} from 'fs';
import {createServer} from 'http';
import {Database} from './services/db';
import {YTAPI} from './services/ytapi';
import * as https from 'http2';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compress from 'compression';
import * as express from 'express';
import * as morgan from 'morgan';

require('dotenv').config();

const database = new Database();
const ytapiService = new YTAPI(database);
const directory = new UserDirectory();

const APP_CONFIG: any = {
  environment: process.env.ENVIRONMENT || 'dev',
  cookie_name: process.env.COOKIE_NAME || 'ytrk_66',
  cookie_secret: process.env.COOKIE_SECRET || 'cookie_secret',
  port: process.env.NODE_PORT || 3000,
  log_level: process.env.MORGAN_LOG_LEVEL || 'dev',
  YTAPI: process.env.YTAPI_KEY || 'fakeapikey',
  db: database,
  ytapiService: ytapiService,
  userDirectory: directory
};

const app = express();
app.use(compress());
app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser(APP_CONFIG.cookie_secret));
app.use(morgan(APP_CONFIG.log_level));

let server;
if (process.env.HTTPS) {
    let ssl_config = {
        key: (process.env.SSLKEY ? readFileSync(process.env.SSLKEY) : undefined),
        cert: (process.env.SSLCERT ? readFileSync(process.env.SSLCERT) : undefined),
        ca: (process.env.SSLCHAIN ? readFileSync(process.env.SSLCHAIN) : undefined),
        pfx: (process.env.SSLPFX ? readFileSync(process.env.SSLPFX) : undefined)
    };
    server = https.createServer(ssl_config, app);
    let redir = express();
    redir.get('*', (req, res, next) => {
      let httpshost = `https://${req.headers.host}${req.url}`;
      return res.redirect(httpshost);
    });
    redir.listen(80);
} else {
    server = createServer(app);
}

/*-------- SOCKET CONNECTIONS --------*/
let io = require('socket.io')(server);
APP_CONFIG.Socks = io;

/*-------- API --------*/
app.use('/api', require('./routes/api')(APP_CONFIG));

/*------- Angular client on Root ------- */
app.set('view engine', 'html');
app.use(express.static(join(__dirname, '../client')));
app.get('/*', function(req, res){
  return res.sendFile(join(__dirname, '../client/index.html'));
});

app.all('*', function(req, res){
  return res.status(404).send('404 UNKNOWN ROUTE');
});

server.listen(APP_CONFIG.port);

console.log('App started on port', APP_CONFIG.port);
