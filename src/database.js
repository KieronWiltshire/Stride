'use strict';

import Path from 'path';
import Env from '~/env';
import Errors from '~/errors';
import MongoDB from 'mongodb';
import Respondent from 'respondent';
import {default as createDebugger} from 'debug';

const MongoClient = MongoDB.MongoClient;
export const ObjectID = MongoDB.ObjectID;

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

/**
 * Debugger
 */
const debug = createDebugger(config.get('app.name') + ':' + 'database');

/**
 * Error codes.
 */
export const noDatabaseHostSpecifiedCode = new Errors.ErrorCode('no_database_host_specified', { message: 'You must specify a host in order to establish a database connection' });
export const databaseNotConnectedCode = new Errors.ErrorCode('no_database_connection_established', { message: 'A database connection needs to be established' });

/**
 * Connection options
 */
export let options = {
  host: config.get('database.host', '127.0.0.1'),
  port: config.get('database.port', '3306'),
  user: config.get('database.username', 'root'),
  password: config.get('database.password', ''),
  db: config.get('database.database', 'sntl'),
};

let connection = null;
let connectionURL = null;

if (options.user && options.password) {
  connectionURL = (options.user + ':' + options.password);
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
}

/**
 * Export connection
 */
export const client = MongoClient.connect('mongodb://' + connectionURL, {
  useNewUrlParser: true
});

/**
 * Export getConnection
 */
export const getConnection = async function() {
  if (!connection) {
    try {
      connection = await client;
    } catch (error) {
      debug(error);
    }
  }

  if (!connection) {
    throw new Errors.InternalServerError().push(databaseNotConnectedCode);
  }

  return connection;
};

export const isConnected = async function() {
  await getConnection();

  if (connection) {
    return connection.isConnected();
  }

  return false;
}

/**
 * Export connection
 */
export default client;
