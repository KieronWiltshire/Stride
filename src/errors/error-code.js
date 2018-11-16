'use strict';

export default class ErrorCode {

  /**
   * Create an ErrorCode instance.
   *
   * @param {string|number} code
   * @param {string} message
   */
  constructor(code, meta) {
    if (typeof code === 'string' || typeof code === 'number') {
      this.code = code;
      this.setMeta(meta);
    } else {
      throw new Error('{code} must be of type string or number');
    }
  }

  /**
   * Retrieve the error code.
   *
   * @returns {string|number}
   */
  getCode() {
    return this.code;
  }

  /**
   * Retrieve the error code meta data.
   *
   * @returns {Object}
   */
  getMeta() {
    return Object.assign({}, this.meta);
  }

  /**
   * Set the meta data of the error code.
   *
   * @param {Object} meta
   */
  setMeta(meta) {
    if (meta) {
      if (typeof meta === 'object') {
        this.meta = meta;
      } else {
        throw new Error('{meta} must be of type object');
      }
    }
    return this;
  }

  /**
   * Clone's the error object and returns a new one.
   *
   * @returns {ErrorCode}
   */
  clone() {
    return new ErrorCode(this.getCode(), this.getMeta());
  }

};
