'use strict';

import ErrorCode from '~/errors/error-code';

export default class BaseError extends Error {

  /**
   * Create a base error
   *
   * @returns {Object} error
   */
  constructor() {
    super();
    this.type = 'BaseError';
    this.status = 0;
    this.message = super.message;
    this.context = [];

    /**
     * Add some context to the error.
     *
     * @param {Object} e
     */
    this.push = function(e) {
      if (e instanceof ErrorCode) {
        this.context.push(e);
      } else {
        throw new Error('You may only pass through {ErrorCode} instances to the error context');
      }
      return this;
    }

    /**
     * Check if the Error contains a specified {ErrorCode}
     *
     * @param {string|number} code
     * @returns {boolean} true if the error contains the code
     */
    this.hasErrorCode = function(code) {
      for (let i = 0; i < this.context.length; i++) {
        if (this.context[i].code.toLowerCase() === String(code).toLowerCase()) {
          return true;
        }
      }
      return false;
    };
  }

}
