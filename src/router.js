'use strict';

import Fs from 'fs';
import Path from 'path';
import Errors from '~/errors';
import Express from 'express';
import { publicDir } from '~/app';
import APIRouter from '~/routes/api';
import * as Database from './database';

/**
 * Initialize the router.
 */
const Router = Express.Router();

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
  if (await Database.isConnected()) {
    next();
  } else {
    next(new Errors.InternalServerError().push(Database.databaseNotConnectedCode));
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
Router.use(function(request, response, next) {
  next(new Errors.NotFoundError()); // Resource not found
});

export default Router;
