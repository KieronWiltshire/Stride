'use strict';

import _ from 'lodash';

/**
 *
 */
export default class Context {

  /**
   * Create a new {Context} instance.
   */
  constructor() {
    this._c = {};
  }

  /**
   * Retrieve the entire context.
   *
   * @returns {object}
   */
  all() {
    return _.clone(this._c);
  }

  /**
   * Set the value of a particular context.
   *
   * @param {object} item
   */
  set(key, value) {
    if (!key || !value) {
      throw new Error('The context must accept a key/value pair');
    }

    this._c[key] = value;
  }

  /**
   * Remove a particular value from the context.
   *
   * @param {string} key
   */
  unset(key) {
    delete this._c[key];
  }

  /**
   * Retrieve a value from the context.
   *
   * @param {string} key
   * @returns {} value
   */
  get(key) {
    return this._c[key];
  }

  /**
   * Check if a particular context exists.
   *
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    let v = this.get(key);
    return ((v !== undefined) && (v !== null));
  }

};
