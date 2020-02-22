'use strict';

import BaseError from '~/errors/base';

export default class NotFoundError extends BaseError {

  /**
   * Create a NotFoundError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'NotFoundError';
    this.status = 404;
    this.message = 'The intended resource could not be found';
  }

}
