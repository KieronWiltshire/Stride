'use strict';

import Env from '~/env';
import Errors from './index';
import Path from 'path';
import Respondent from 'respondent';
import {default as createDebugger} from 'debug';
import BaseError from './base-error';

const config = new Respondent({ rootDir: Path.join(__dirname, '..', 'config'), env: Env });
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
        message: 'If this error persists, then please contact an administrator'
      }));
    }

    delete error.status;
    return error;
  }

};
