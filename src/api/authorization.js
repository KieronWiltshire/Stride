'use strict';

import _ from 'lodash';
import EventEmitter from 'events';
import Errors from '~/errors';
import { Guard, Permission } from 'gelert';
import Base from './base';

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
