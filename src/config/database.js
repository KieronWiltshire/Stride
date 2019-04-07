'use strict';

import Path from 'path';

/**
 * Database configuration
 */
var options = {};

/**
 * Database's host
 *
 * The database's host address.
 */
options['host'] = process.env.DB_HOST || '127.0.0.1';

/**
 * Database's port
 *
 * The database's port.
 */
options['port'] = process.env.DB_PORT || 27017;

/**
 * Database's username
 *
 * The username used to access the database.
 */
options['username'] = process.env.DB_USERNAME || 'root';
options['user'] = options['username'];

/**
 * Database's password
 *
 * The password used to access the database.
 */
options['password'] = process.env.DB_PASSWORD || null;

/**
 * Database's name
 *
 * The name of the database to access.
 */
options['database'] = process.env.DB_NAME || 'testapp';
options['db'] = options['database'];

/**
 * Database migrations directory
 *
 * The path to the directory that holds the migration files.
 */
options['migrationsDir'] = Path.join(__dirname, '..', 'migrations');
options['directory'] = options['migrationsDir'];

/**
 * Database seeders directory
 *
 * The path to the directory that holds the seeder files.
 */
options['seedersDir'] = Path.join(__dirname, '..', 'seeders');

export default options;
