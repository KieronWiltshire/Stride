'use strict';

import BaseError from '~/errors/base';

export default class ForbiddenError extends BaseError {

  /**
   * Create a ForbiddenError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'ForbiddenError';
    this.status = 403;
    this.message = 'You are forbidden to make that request';
  }

}
