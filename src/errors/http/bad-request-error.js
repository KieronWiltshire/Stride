'use strict';

import BaseError from '~/errors/base';

export default class BadRequestError extends BaseError {

  /**
   * Create a BadRequestError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'BadRequestError';
    this.status = 400;
    this.message = 'The server could not process the request'
  }

}
