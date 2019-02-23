'use strict';

// import '~/listeners';
import Path from 'path';
import Env from '~/env';
import Cors from 'cors';
import IO from 'socket.io';
import Helmet from 'helmet';
import Logger from 'morgan';
import Express from 'express';
import Respondent from 'respondent';
import BodyParser from 'body-parser';
import CookieParser from 'cookie-parser';
import Context from '~/utilities/context';
import MethodOverride from 'method-override';

/**
 * Load configurations
 */
export const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

/**
 * Directories
 */
export const viewsDir = Path.join(__dirname, 'views');
export const publicDir = Path.join(__dirname, '..', 'public');
export const storageDir = Path.join(__dirname, 'storage');

/**
 * Configure Express
 */
export const Application = Express();
export const io = IO();

/**
 * Setup view engine && pretty responses
 */
if (config.get('app.prettify', false)) {
  Application.locals.pretty = true;
  Application.set('json spaces', 2);
}

Application.set('views', viewsDir);
Application.set('view engine', config.get('app.viewEngine', 'pug'));

// .
Application.disable('etag');

/**
 * Configure the application proxy settings
 */
Application.set('trust proxy', config.get('app.behindProxy', false));

/**
 * Configure the application port
 */
Application.set('port', function(val) {
  let port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}(config.get('http.port', 80)));

/**
 * Serve the favicon
 */
// let faviconPath = Path.join(publicDir, 'favicon.ico');
// if (Fs.existsSync(faviconPath)) {
//   Application.use(favicon(faviconPath));
// }

/**
 * Global Middleware
 */
if (process.env.NODE_ENV !== 'testing') {
  Application.use(Logger('dev'));
}

Application.use(BodyParser.json());
Application.use(BodyParser.urlencoded({ 'extended': true }));
Application.use(CookieParser(config.get('app.key', null), {
  'httpOnly': true,
  'secure': config.get('app.secure', false)
}));
Application.use(Helmet());
Application.use(MethodOverride('X-HTTP-Method-Override'));
Application.use(Cors());

/**
 * Apply context to request object
 */
Application.use(function(request, response, next) {
  request = Context(request);

  next();
});

export default Application;
