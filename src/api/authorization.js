'use strict';

import _ from 'lodash';
import Base from './base';
import EventEmitter from 'events';
import Errors from '~/errors';
import * as Database from '~/database';
import { Guard, Permission } from 'gelert';

/**
 * Error codes.
 */
export const cannotSerializeGuard = new Errors.ErrorCode('cannot_serialize_guard', { message: 'The guard could not be serialized' });
export const guardCannotBeCreatedCode = new Errors.ErrorCode('cannot_create_guard', { message: 'The guard could not be created' });

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

  /**
   * TODO:
   *
   * findGuard
   * addInheritence
   * removeInheritence
   * addPermission
   * removePermission
   * hasPermission
   */

  /**
   * Serialize {Guard}.
   *
   * @param {Guard} guard
   * @return {Object}
   */
  _serialize(guard) {
    let name = (guard instanceof Guard) ? guard.getId() : guard.id;
    let type = (guard instanceof Guard) ? guard.getType() : guard.type;

    if (name && type) {
      let inheritence = [];
      let permissions = [];

      if (guard instanceof Guard) {
        guard.guards().forEach((g) => {
          inheritence.push({
            name: g.getId(),
            type: g.getType()
          });
        });

        guard.permissions().forEach((p) => {
          permissions.push(p.getValue());
        });
      }

      return _.extend({}, {
        name,
        type,
        inheritence,
        permissions,
      });
    } else {
      throw new Errors.InternalServerError().push(cannotSerializeGuard);
    }
  }

  /**
   * Retrieve {Guard} index.
   *
   * @param {number} limit
   * @param {number} offset
   * @param {any} filter
   * @returns {Array<Guard>}
   */
  async index({ limit, offset, type } = {}) {
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('guards');
    let result = collection.find({ type });

    if (limit) {
      limit = this.validatePaginationParameter({ type: 'limit', value: limit });
      result.limit(limit);
    }

    if (offset) {
      offset = this.validatePaginationParameter({ type: 'offset', value: offset });
      result.skip(offset);
    }

    return result.toArray();
  }

 /**
  * Create a new {Guard}.
  *
  * @param {string} email
  * @param {string} username
  * @param {string} password
  * @returns {User}
  */
  async create({ id, type }) {
    let validationErrors = [];
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('guards');
    let exists = await collection.find({ id, type }).toArray();

    if (exists.length <= 0) {
      let now = new Date();
      let guard = new Guard({ id, type });
      let record = null;

      try {
        record = await collection.insertOne(_.extend({}, this._serialize(guard), {
          createdAt: now,
          updatedAt: now,
        }));
      } catch (error) {
        this.debug(error);
      }

      if ((!record) || (record && !record.ops) || (record && record.ops && !record.ops[0])) {
        throw new Errors.InternalServerError();
      }

      record = record.ops[0];

      // Throw event
      this.emit('create', { record, guard });

      return guard;
    } else {
      for (let record of exists) {
        if ((record.name) && (record.name.toLowerCase() === id.toLowerCase()) && (record.type) && (record.type === type)) {
          validationErrors.push('id');
          validationErrors.push('type');
          break;
        }
      }
    }

    let meta = guardCannotBeCreatedCode.getMeta();
        meta.fields = validationErrors;

    throw new Errors.ValidationError().push(guardCannotBeCreatedCode.clone().setMeta(meta));
  }


  // TODO:

}

export default (new AuthorizationAPI());
