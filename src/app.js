'use strict';

import Path from 'path';
import Express from 'express';
import Config from '~/config';

/**
 * Directories
 */
export const viewsDir = Path.join(__dirname, 'views');
export const publicDir = Path.join(__dirname, '..', 'public');
export const storageDir = Path.join(__dirname, '..', 'storage');

/**
 * Configure Express
 */
export const Application = Express();

/**
 * Setup view engine && pretty responses
 */
if (Config.get('app.prettify', false)) {
  Application.locals.pretty = true;
  Application.set('json spaces', 2);
}

Application.set('views', viewsDir);
Application.set('view engine', Config.get('app.viewEngine', 'pug'));

// .
Application.disable('etag');

/**
 * Configure the application proxy settings
 */
Application.set('trust proxy', Config.get('app.behindProxy', false));

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
}(Config.get('http.port', 80)));

// Export
export default Application;
