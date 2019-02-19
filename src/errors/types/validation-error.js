'use strict';

import BaseError from '../base-error';

export default class ValidationError extends BaseError {

  /**
   * Create a ValidationError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'ValidationError';
    this.status = 422;
    this.message = 'A validation concern exists within the request context';
  }

}
