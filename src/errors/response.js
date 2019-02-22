'use strict';

import Path from 'path';
import Env from '~/env';
import Errors from '~/errors';
import Respondent from 'respondent';
import BaseError from '~/errors/base-error';
import {default as createDebugger} from 'debug';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, '..', 'config'), env: Env });

/**
 * Debugger
 */
const debug = createDebugger(config.get('app.name') + ':' + 'errors:response');

/**
 *
 */
export default class ErrorResponse {

  /**
   * Create an {Error} from HTTP status.
   *
   * @param {number} status
   * @return {Error}
   */
  static createErrorFromStatus(status) {
    let error = null;
    switch(status) {
      case 400:
        error = new Errors.BadRequestError();
        break;
      case 401:
        error = new Errors.UnauthorizedError();
        break;
      case 403:
        error = new Errors.ForbiddenError();
        break;
      case 503:
        error = new Errors.ServiceUnavailableError();
        break;
      default:
        error = new Errors.InternalServerError();
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
      error = new Errors.InternalServerError();
      error.push(new Errors.ErrorCode('contact_support', {
        message: 'If this error persists then please contact an administrator'
      }));
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
      error: ErrorResponse.format(error)
    });
  }
  /* eslint-enable */

}
