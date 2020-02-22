'use strict';

/**
 * Greenlock configuration
 */

var options = {};

/**
 * Whether or not to enable greenlock
 */
options['enabled'] = (process.env.GREENLOCK !== null) ? process.env.GREENLOCK : true;

/**
 * Admin email to own generated certificates
 */
options['email'] = process.env.GREENLOCK_EMAIL || 'user@example.com';

/**
 * A list of domains to be certified
 */
options['approveDomains'] = process.env.GREENLOCK_APPROVE_DOMAINS || [ 'user@example.com' ];

/**
 * Ensure configuration is correct:
 */
{
  /* APPROVE_DOMAINS */ {
    if (options['approveDomains'] && !Array.isArray(options['approveDomains'])) {
      options['approveDomains'] = [ options['approveDomains'] ];
    }
  }
}

export default options;