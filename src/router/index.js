'use strict';

import Fs from 'fs';
import Path from 'path';
import Cors from 'cors';
import Helmet from 'helmet';
import Logger from 'morgan';
import Errors from '~/errors';
import Express from 'express';
import APIRouter from '~/router/api';
import BodyParser from 'body-parser';
import {publicDir} from '~/app';
import CookieParser from 'cookie-parser';
import MethodOverride from 'method-override';
import Config from '~/config';
import Database from '~/database';
import NotConnectedCode from '~/errors/codes/database/not-connected';
import InvalidRouteCode from '~/errors/codes/router/invalid-route';

/**
 * Initialize the router.
 */
const Router = Express.Router();

/**
 * Global Middleware
 */
if (process.env.NODE_ENV !== 'testing') {
  Router.use(Logger('dev'));
}

// let faviconPath = Path.join(publicDir, 'favicon.ico');
// if (Fs.existsSync(faviconPath)) {
//   Application.use(favicon(faviconPath));
// }

Router.use(BodyParser.json());
Router.use(BodyParser.urlencoded({ 'extended': true }));
Router.use(CookieParser(Config.get('app.key', null), {
  'httpOnly': true,
  'secure': Config.get('app.secure', false)
}));
Router.use(Helmet());
Router.use(MethodOverride('X-HTTP-Method-Override'));
Router.use(Cors());

/**
 * Configure non-api endpoints
 */
Router.use('/public', Express.static(publicDir));

/**
 * Ensure that the database is connected before
 * allowing the request to continue through it's
 * lifecycle.
 */
Router.use(async function(request, response, next) {
  try {
    if (Database.isConnected()) {
      next();
    } else {
      next(Errors.status(500).push(NotConnectedCode));
    }
  } catch (error) {
    next(error);
  }
});

// Apply router if after the middleware has been applied
Router.use('/api', APIRouter);

/**
 * Redirect other calls to the application router, if a route cannot be found
 * or the error isn't handled, then we fallback to the public directory thus
 * leaving the client to deal with it.
 */
Router.use(function(request, response, next) {
  if (request.originalUrl.startsWith('/api')) {
    next(Errors.status(404).push(InvalidRouteCode));
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
Router.use(function(request, response, next) {
  next(Errors.status(404).push(InvalidRouteCode)); // Resource not found
});

export default Router;
