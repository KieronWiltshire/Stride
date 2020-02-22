'use strict';

import BaseError from '~/errors/base';

export default class UnauthorizedError extends BaseError {

  /**
   * Create a UnauthorizedError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'UnauthorizedError';
    this.status = 401;
    this.message = 'You are unauthorized to make that request';
  }

}
