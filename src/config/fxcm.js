'use strict';

/**
 * FXCM API configurations
 */
let options = {};

/**
 * API Host.
 *
 * The host required for the API access and communication.
 */
options['host'] = process.env.FXCM_API_HOST || 'api-demo.fxcm.com';

/**
 * API Port.
 *
 * The port required for the API access and communication.
 */
options['port'] = process.env.FXCM_API_PORT || 443;

/**
 * API Protocol
 *
 * The protocol required for API access and communication.
 */
options['protocol'] = process.env.FXCM_API_PROTOCOL || 'https';

/**
 * API Protocol
 *
 * The protocol required for API access and communication.
 */
options['accessToken'] = process.env.FXCM_API_ACCESS_TOKEN || 'secret';

export default options;
