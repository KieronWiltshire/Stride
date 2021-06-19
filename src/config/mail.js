'use strict';

/**
 * Sentinel confirguration
 */
let options = {};

/**
 * Mailer's host
 *
 * The mailer's host address.
 */
options['host'] = process.env.MAIL_HOST || 'smtp.ethereal.email';

/**
 * Mailer's port
 *
 * The mailer's port.
 */
options['port'] = process.env.MAIL_PORT || 587;

/**
 * Connect to the mailer using SSL/TLS
 */
options['secure'] = (process.env.MAIL_SECURE !== null) ? process.env.MAIL_SECURE : false;

/**
 * Mailer's username
 *
 * The username used to authenticate.
 */
options['username'] = process.env.MAIL_USERNAME || 'no-reply@example.com';

/**
 * Mailer's password
 *
 * The password used to authenticate.
 */
options['password'] = process.env.MAIL_PASSWORD || '';

/**
 * The sender of the emails
 *
 * The sender will default to the username but can optionally be
 * overridden here or by specifying a `MAIL_SENDER` parameter in
 * the `.env` file.
 */
options['sender'] = process.env.MAIL_SENDER || options['username'] || 'no-reply@example.com';

export default options;
