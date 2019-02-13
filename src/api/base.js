'use strict';

import Path from 'path';
import Env from '~/env';
import Errors from '~/errors';
import Application from '~/app';
import EventEmitter from 'events';
import Validator from 'validator';
import Respondent from 'respondent';
import {default as createDebugger} from 'debug';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

/**
 * Base class which contains shared code
 */
export default class Base extends EventEmitter {

  /**
   * Create a new {Base} class instance.
   *
   * @param {string} debugPrefix
   * @returns {Base}
   */
  constructor(debugPrefix) {
    super();
    this._config = config;
    this._debug = createDebugger(this.getConfig().get('app.name') + ':api:' + debugPrefix);
    this._url = this.getConfig().get('app.url', 'www.example.com');
  }

  /**
   * Retrieve the configuration accessor.
   *
   * @returns {Respondent}
   */
  getConfig() {
    return this._config;
  }

  /**
   * Debug an error.
   *
   * @param {Error} error
   * @returns {void}
   */
  debug(error) {
    this._debug(error);
  }

  /**
   * Retrieve the application's URL.
   *
   * @param {boolean} includeProtocol
   * @returns {string}
   */
  getURL({ includeProtocol = true } = {}) {
    if (includeProtocol) {
      return (config.get('http.secure', true) ? 'https://' : 'http://') + this._url;
    } else {
      return this._url;
    }
  }

  /**
   * Validate the pagination value and throw a
   * {ValidationError} if it fails.
   *
   * @param {string} type "limit" or "offset"
   * @param {integer} value
   * @return {integer}
   *
   * @throws {ValidationError} if the validation fails
   */
  validatePaginationParameter({ type, value } = {}) {
    if (type && (type === 'limit' || type === 'offset')) {
      if (Validator.isInt(String(value))) {
        return value;
      } else {
        throw new Errors.ValidationError().push(new Errors.ErrorCode('invalid_pagination_value', {
          message: 'The specified pagination value must be an integer',
          field: type,
          value
        }));
      }
    } else {
      throw new Errors.InternalServerError;
    }
  }

  /**
   * Render a view using the specified view engine.
   *
   * Note:
   *  This method is only accessible once the {Application}
   *  has been setup completely.
   *
   * @param {string} view
   * @param {Object} data
   * @return {string} html
   *
   * @throws {Error}
   */
  async render({ view, data = {} }) {
    return new Promise(function(resolve, reject) {
      Application.render(view, data, function(error, html) {
        if (error) {
          reject(error);
        } else {
          resolve(html);
        }
      });
    });
  }

}
