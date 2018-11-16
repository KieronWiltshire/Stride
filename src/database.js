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

/**
 * Error codes.
 */
export const noDatabaseHostSpecifiedCode = new Errors.ErrorCode('no_database_host_specified', { message: 'You must specify a host in order to establish a database connection' });
export const noActualDatabaseSpecifiedCode = new Errors.ErrorCode('no_actual_database_specified', { message: 'You must specify a database name in order to establish a database connection' });
export const databaseNotConnectedCode = new Errors.ErrorCode('database_not_connected', { message: 'A connection to the database needs to be established' });
export const databaseConnectionFailedCode = new Errors.ErrorCode('database_connection_failed', { message: 'A connection to the database was unable to be made' });

/**
 * ..
 */
let connectionURL = null;
let isConnectionEstablished = false;

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
  throw new Errors.InternalServerError().push(noDatabaseHostSpecifiedCode);
}

if (options.port) {
  connectionURL += ':' + options.port;
}

if (options.db) {
  connectionURL += '/' + options.db;
} else {
  throw new Errors.InternalServerError().push(noActualDatabaseSpecifiedCode);
}

/**
 * Check if a connection to the database exists.
 *
 * @returns {boolean}
 */
export function hasDatabaseConnection() {
  return isConnectionEstablished;
}

/**
 * Create an instance of {Monk}.
 */
let monk = Monk(connectionURL).then((db) => {
  isConnectionEstablished = true;

  /**
   * When the driver's connection to the database has timed out.
   */
  db.on('timeout', () => {
    isConnectionEstablished = false;
  });

  /**
   * When the driver has closed the connection.
   */
  db.on('close', () => {
    isConnectionEstablished = false;
  });

  /**
   * When the driver has reconnected.
   */
  db.on('reconnect', () => {
    isConnectionEstablished = true;
  });
}).catch((error) => {
  isConnectionEstablished = false;
  throw new Errors.InternalServerError().push(databaseConnectionFailedCode);
});


/**
 * Export database functions
 */
export default monk;
