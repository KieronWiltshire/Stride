'use strict';

import Path from 'path';

/**
 * HTTP configuration
 */

var options = {};

/**
 * Run the application using a HTTPS connection
 */
options['secure'] = (process.env.HTTP_SECURE !== null) ? process.env.HTTP_SECURE : true;

/**
 * The HTTPS TLS/SSL key and certificate locations
 */
options['secureKeyPath'] = (process.env.HTTP_SECURE_KEY_PATH) ? (process.env.HTTP_SECURE_KEY_PATH) : Path.join('key.pem');
options['secureCertPath'] = (process.env.HTTP_SECURE_CERTIFICATE_PATH) ? (process.env.HTTP_SECURE_CERTIFICATE_PATH) : Path.join('certificate.pem');

/**
 * The server port to run the application on
 */
options['port'] = process.env.HTTP_PORT || 80;

/**
 * Ensure configuration is correct:
 */
{
  /* HTTPS */ {
    options['secureKeyPath'] = Path.resolve(options['secureKeyPath']);
    options['secureCertPath'] = Path.resolve(options['secureCertPath']);
  }
}

export default options;