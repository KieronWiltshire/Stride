'use strict';

/**
 * JSON Web Token confirguration
 */
let options = {};

/**
 * Token expiry time
 *
 * The amount of time until the token is no
 * longer valid in seconds.
 */
options['expiresIn'] = (60 * 60 * 24 * 7); // 7 days per token

export default options;
