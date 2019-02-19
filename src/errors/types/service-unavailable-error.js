'use strict';

import BaseError from '../base-error';

export default class ServiceUnavailableError extends BaseError {

  /**
   * Create a NotFoundError response
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'ServiceUnavailableError';
    this.status = 503;
    this.message = 'The service is temporarily unavailable';
  }

}
