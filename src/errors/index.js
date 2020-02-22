'use strict';

import BaseError from '~/errors/base';
import HTTPError from '~/errors/http';
import {default as createDebugger} from 'debug';
import Config from '~/config';
import ContactSupportCode from '~/errors/codes/server/contact-support';

/**
 * Debugger
 */
const debug = createDebugger(Config.get('app.name') + ':' + 'errors:index');

/**
 *
 */
export default class Error {

  /**
   * Create an {Error} from HTTP status.
   *
   * @param {number} status
   * @return {Error}
   */
  static status(status) {
    let error = null;
    switch(status) {
      case 400:
        error = new HTTPError.BadRequestError();
        break;
      case 401:
        error = new HTTPError.UnauthorizedError();
        break;
      case 403:
        error = new HTTPError.ForbiddenError();
        break;
      case 404:
        error = new HTTPError.NotFoundError();
        break;
      case 503:
        error = new HTTPError.ServiceUnavailableError();
        break;
      default:
        error = new HTTPError.InternalServerError();
        break;
    }
    return error;
  }

  /**
   * Format a particular type of error.
   *
   * @param {Error} error
   * @returns {object}
   */
  static format(error) {
    if (!(error instanceof BaseError)) {
      debug(error);
      error = new HTTPError.InternalServerError();

      error.push(ContactSupportCode);
    }

    delete error.status;
    return error;
  }

  /**
   * The error response handler.
   *
   * @param {Error} error
   * @param {Request} request
   * @param {Response} response
   * @param {function} next
   * @returns {object}
   */
  /* eslint-disable no-unused-vars */
  static handler(error, request, response, next) {
    debug(error);

    response.status(error.status || 500).json({
      error: Error.format(error)
    });
  }
  /* eslint-enable */

}
