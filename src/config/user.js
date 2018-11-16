'use strict';

/**
 * JSON Web Token confirguration
 */
let options = {};

/**
 * Password hashing rounds
 *
 * The hashing process will go through a series
 * of rounds to give you a secure hash.
 */
options['passwordHashRounds'] = 10;

/**
 * Token expiry time
 *
 * The amount of time until the token is no
 * longer valid in seconds.
 */
options['passwordResetTokenExpiry'] = (60 * 60 * 24 * 1); // 1 day per token

export default options;
