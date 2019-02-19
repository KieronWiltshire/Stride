'use strict';

import Fs from 'fs';
import '~/listeners';
import Path from 'path';
import Env from '~/env';
import Cors from 'cors';
import IO from 'socket.io';
import Helmet from 'helmet';
import Logger from 'morgan';
import Express from 'express';
import Errors from '~/errors';
import Router from '~/routes';
import Respondent from 'respondent';
import BodyParser from 'body-parser';
import CookieParser from 'cookie-parser';
import Context from '~/utilities/context';
import MethodOverride from 'method-override';
import ErrorResponse from '~/errors/response';
import {default as createDebugger} from 'debug';
import * as Database from './database';

/**
 * Load configurations
 */
export const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

/**
 * Debugger
 */
const debug = createDebugger(config.get('app.name') + ':' + 'app');

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

/**
 * Serve the favicon
 */
// let faviconPath = Path.join(publicDir, 'favicon.ico');
// if (Fs.existsSync(faviconPath)) {
//   Application.use(favicon(faviconPath));
// }

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
Application.use(async function(request, response, next) {
  if (await Database.isConnected()) {
    next();
  } else {
    next(new Errors.InternalServerError().push(Database.databaseNotConnectedCode));
  }
});

// Apply router if after the middleware has been applied
Application.use('/api', Router);

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

/**
 * Apply a route error response handler
 */
/* eslint-disable no-unused-vars */
Application.use(function(error, request, response, next) {
  debug(error);
  response.status(error.status || 500).json({
    error: ErrorResponse.format(error)
  });
});
/* eslint-enable */

export default Application;
