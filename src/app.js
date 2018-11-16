'use strict';

import Fs from 'fs';
import Path from 'path';
import Cors from 'cors';
import Env from '~/env';
import IO from 'socket.io';
import Logger from 'morgan';
import Helmet from 'helmet';
import Express from 'express';
import Router from '~/routes';
import Errors from '~/errors';
import Respondent from 'respondent';
import BodyParser from 'body-parser';
import Context from '~/utilities/context';
import CookieParser from 'cookie-parser';
import MethodOverride from 'method-override';
import {default as createDebugger} from 'debug';
import ErrorResponse from '~/errors/response';
import {default as Database, hasDatabaseConnection, databaseNotConnectedCode} from './database';
import '~/listeners';

export const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

const debug = createDebugger(config.get('app.name') + ':' + 'app');

export const viewsDir = Path.join(__dirname, 'views');
export const publicDir = Path.join(__dirname, '..', 'public');
export const storageDir = Path.join(__dirname, 'storage');

export const io = IO();

/**
 * Configure Express
 */
export const Application = Express();

/**
 * Setup view engine && pretty responses
 */
if (config.get('app.prettify', false)) {
  Application.locals.pretty = true;
  Application.set('json spaces', 2);
}

Application.set('views', viewsDir);
Application.set('view engine', config.get('app.viewEngine', 'pug'));

/**
 * Serve the favicon
 */
let faviconPath = Path.join(publicDir, 'favicon.ico');
if (Fs.existsSync(faviconPath)) {
  Application.use(favicon(faviconPath));
}

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
 * ... Middleware ...
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
  request['req-ctx'] = new Context();

  request.getContext = function() {
    return request['req-ctx'];
  };

  next();
});

/**
 * Configure non-api endpoints
 */
Application.use('/public', Express.static(publicDir));

/**
 * Ensure that the database is connected before
 * allowing the request to continue through it's
 * lifecycle.
 */
Application.use(function(request, response, next) {
  if (hasDatabaseConnection()) {
    next();
  } else {
    next(new Errors.InternalServerError().push(databaseNotConnectedCode));
  }
});

// Apply router if after the middleware has been applied
Application.use(Router);

/**
 * Redirect other calls to the application router, if a route cannot be found
 * or the error isn't handled, then we fallback to the public directory thus
 * leaving the client to deal with it.
 */
Application.use(function(request, response, next) {
  if (request.originalUrl.startsWith('/api')) {
    next(new Errors.NotFoundError());
  } else {
    let indexFile = Path.join(publicDir, 'index.html');
    if (Fs.existsSync(indexFile)) {
      response.sendFile(indexFile);
    } else {
      next();
    }
  }
}, Express.static(publicDir));

// Apply 404 catch
Application.use(function(request, response, next) {
  next(new Errors.NotFoundError()); // Resource not found
});

// Apply a route response handler
Application.use(function(error, request, response, next) {
  debug(error);
  response.status(error.status || 500).json({
    error: ErrorResponse.format(error)
  });
});

export default Application;
