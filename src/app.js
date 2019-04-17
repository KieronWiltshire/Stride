'use strict';

import Path from 'path';
import Env from '~/env';
import Express from 'express';
import Respondent from 'respondent';

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

// Export
export default Application;
