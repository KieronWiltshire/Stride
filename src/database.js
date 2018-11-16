'use strict';

import Path from 'path';
import Respondent from 'respondent';
import Env from '~/env';
import Monk from 'monk';
import Errors from '~/errors';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

let connectionURL = null;

/**
 * Connection options
 */
let options = {
  host: config.get('database.host', '127.0.0.1'),
  port: config.get('database.port', '3306'),
  user: config.get('database.username', 'root'),
  password: config.get('database.password', ''),
  db: config.get('database.database', 'sntl'),
};

if (options.user && options.password) {
  connectionURL = options.user + ':' + options.password;
}

if (options.host) {
  if (connectionURL) {
    connectionURL += '@' + options.host;
  } else {
    connectionURL = options.host;
  }
} else {
  throw new Errors.InternalServerError().push(new Errors.ErrorCode('no_host_specified', {
    message: 'You must specify a host in order to establish a database connection'
  }));
}

if (options.port) {
  connectionURL += ':' + options.port;
}

if (options.db) {
  connectionURL += '/' + options.db;
} else {
  throw new Errors.InternalServerError().push(new Errors.ErrorCode('no_database_specified', {
    message: 'You must specify a database name in order to establish a database connection'
  }));
}

/**
 * Export database functions
 */
export default Monk(connectionURL);
