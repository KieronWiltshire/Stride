'use strict';

import {config} from '~/app';
import Errors from '~/errors';
import {default as createDebugger} from 'debug';
import AuthenticationAPI, {tokenRequiredCode} from '~/api/authentication';

/**
 * Debugger
 */
const debug = createDebugger(config.get('app.name') + ':' + 'middleware:authentication');

/**
 * Error codes.
 */
export let badSchemeCode = new Errors.ErrorCode('authorization_bad_scheme', { message: 'Correct format "Authorization: Bearer {token}"' });
export let badFormatCode = new Errors.ErrorCode('authorization_bad_format', { message: 'Correct format "Authorization: Bearer {token}"' });

/**
 * Authentication middleware.
 *
 * The middleware will retrieve the authorization token from
 * the request and will determine it's validity, if valid then
 * the user will be added onto the request context otherwise
 * the request context will be set to the relevant error.
 *
 * This middleware is slightly adapted from the 'express-jwt'
 * npm module. (https://github.com/auth0/express-jwt).
 *
 * @returns {function} middleware
 */
export default (async function(request, response, next) {
  let token = null;

  if (request.method === 'OPTIONS' && request.headers.hasOwnProperty('access-control-request-headers')) {
    let hasAuthInAccessControl = !!~request.headers['access-control-request-headers']
                                  .split(',').map(function (header) {
                                    return header.trim();
                                  }).indexOf('authorization');

    if (hasAuthInAccessControl) {
      return next();
    }
  }

  if (request.headers && request.headers.authorization) {
    let parts = request.headers.authorization.split(' ');
    if (parts.length == 2) {
      let scheme = parts[0];
      let credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      } else {
        return next(new Errors.BadRequestError().push(badSchemeCode));
      }
    } else {
      return next(new Errors.BadRequestError().push(badFormatCode));
    }
  }

  if (!token) {
    return next(new Errors.UnauthorizedError().push(tokenRequiredCode));
  }

  try {
    let decodedToken = await AuthenticationAPI.verify({ token });

    request.getContext().set('authentication', decodedToken);

    return next();
  } catch (error) {
    debug(error);
    return next(error);
  }
});
