'use strict';

import Base from './base';
import EventEmitter from 'events';
// import Errors from '~/errors';
// import { Guard, Permission } from 'gelert';

/**
 * Error codes.
 */


/**
 * Authorization API
 */
class AuthorizationAPI extends Base {

  /**
   * Create a new {AuthorizationAPI} instance.
   */
  constructor() {
    super('authorization');
    EventEmitter.call(this);
  }

  // TODO:

}

export default (new AuthorizationAPI());
