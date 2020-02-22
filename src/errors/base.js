'use strict';

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
      if (e) {
        this.context.push(e);
      }
      return this;
    }
  }

}
