import {UserDirectory} from './services/userdirectory';
import {join} from 'path';
import {readFileSync} from 'fs';
import {createServer} from 'http';
import {Database} from './services/db';
import {YTAPI} from './services/ytapi';
import * as https from 'https';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compress from 'compression';
import * as express from 'express';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';

dotenv.config({silent: true});

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
app.use(morgan((tokens, req, res) => {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens['response-time'](req, res),
        'ms',
        '- user:',
        (res.locals.usersession || {Username: 'Unauthenticated User'}).Username,
        '(' + req.ip + ')'
    ].join(' ');
}));

let server;
if (process.env.HTTPS) {
    let ssl_config = {
        key: (process.env.SSLKEY ? tryLoad(process.env.SSLKEY) : undefined),
        cert: (process.env.SSLCERT ? tryLoad(process.env.SSLCERT) : undefined),
        ca: (process.env.SSLCHAIN ? tryLoad(process.env.SSLCHAIN) : undefined),
        pfx: (process.env.SSLPFX ? tryLoad(process.env.SSLPFX) : undefined)
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

function tryLoad(filePath: string): any {
    if (!filePath || !filePath.length) {
        return undefined;
    }
    try {
        return readFileSync(filePath);
    } catch (err) {
        console.log('Could not load', filePath);
        return undefined;
    }
}
