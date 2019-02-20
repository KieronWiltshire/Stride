'use strict';

import _ from 'lodash';
import Base from '~/api/base';
import Errors from '~/errors';
import EventEmitter from 'events';
import Validator from 'validator';
import * as Database from '~/database';
import { Guard, Permission } from 'gelert';

/**
 * Error codes.
 */
export const cannotSerializeGuard = new Errors.ErrorCode('cannot_serialize_guard', { message: 'The specified guard could not be serialized' });
export const guardCannotBeCreatedCode = new Errors.ErrorCode('cannot_create_guard', { message: 'The guard could not be created' });
export const guardNotFoundCode = new Errors.ErrorCode('guard_not_found', { message: 'The specified guard could not be found' });
export const cannotSaveGuard = new Errors.ErrorCode('cannot_save_guard', { message: 'The specified guard could not be saved' });
export const guardAlreadyDeserialized = new Errors.ErrorCode('guard_already_deserialized', { message: 'The specified guard has already been deserialized' });

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
   * addInheritence
   * removeInheritence
   * addPermission
   * removePermission
   * hasPermission
   */

  /**
   * Retrieve {Guard} index.
   *
   * @param {number} limit
   * @param {number} offset
   * @param {string} type
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
  * @param {string} reference
  * @param {string} type
  * @returns {Guard}
  */
  async create({ reference, type }) {
    let validationErrors = [];

    if (!(reference && typeof reference === 'string')) {
      validationErrors.push('reference');
    }

    if (!(type && typeof type === 'string')) {
      validationErrors.push('type');
    }

    if (validationErrors.length <= 0) {
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('guards');
      let exists = await collection.find({ reference, type }).toArray();

      if (exists.length <= 0) {
        let now = new Date();
        let guard = null;

        try {
          guard = await collection.insertOne(_.extend({}, this._serialize(new Guard({ id: new Database.ObjectID(), type })), {
            reference,
            createdAt: now,
            updatedAt: now,
          }));
        } catch (error) {
          this.debug(error);
        }

        if ((!guard) || (guard && !guard.ops) || (guard && guard.ops && !guard.ops[0])) {
          throw new Errors.InternalServerError();
        }

        guard = guard.ops[0];

        // Throw event
        this.emit('create', { guard });

        return guard;
      } else {
        for (let record of exists) {
          if ((record.reference) && (record.reference.toLowerCase() === reference.toLowerCase()) && (record.type) && (record.type === type)) {
            validationErrors.push('id');
            validationErrors.push('type');
            break;
          }
        }
      }
    }

    let meta = guardCannotBeCreatedCode.getMeta();
        meta.fields = validationErrors;

    throw new Errors.ValidationError().push(guardCannotBeCreatedCode.clone().setMeta(meta));
  }

  /**
   * Find a {Guard} by an unknown parameter.
   *
   * @param {number|string} param
   * @param {number|string} value
   * @param {boolean} regex
   * @returns {Guard}
   */
  async find({ param, value, regex = true } = {}) {
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');

    let filter = {};
        filter[param] = (regex ? { $regex: value } : value);

    return await collection.find(filter);
  }

  /**
   * Find a {Guard} by identifier.
   *
   * @param {string} _id
   * @returns {Guard}
   */
  async findById({ _id }) {
    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('guards');

    let result = await collection.aggregate([
      { $match: {
          _id
      }},
      { $graphLookup: {
          from: 'guards',
          startWith: '$inheritence',
          connectFromField: 'inheritence',
          connectToField: '_id',
          as: 'inheritence'
      }}
    ]);

    result = (await result.toArray());

    if (result.length > 0) {
      return this._nestGuardsByInheritence(result);
    } else {
      throw new Errors.NotFoundError().push(guardNotFoundCode);
    }
  }

  /**
   * Find a {Guard} by reference and type.
   *
   * @param {string} reference
   * @param {string} type
   * @returns {Guard}
   */
  async findByReferenceAndType({ reference, type }) {
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('guards');

    let result = await collection.aggregate([
      { $match: {
          reference,
          type
      }},
      { $graphLookup: {
          from: 'guards',
          startWith: '$inheritence',
          connectFromField: 'inheritence',
          connectToField: '_id',
          as: 'inheritence'
      }}
    ]);

    result = (await result.toArray());

    if (result.length > 0) {
      return this._nestGuardsByInheritence(result);
    } else {
      throw new Errors.NotFoundError().push(guardNotFoundCode);
    }
  }

  /**
   * Update a specific {Guard}.
   *
   * @param {Guard} guard
   * @returns {Guard}
   */
  async _save(guard) {
    if (guard instanceof Guard) {
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('guards');

      let serializedGuard = this._serialize(guard);

      let { _id } = await this.find({ name: serializedGuard.name, type: serializedGuard.type }); // throws not found error if the guard could not be found

      let $set = Object.assign({ updatedAt: new Date() }, serializedGuard);

      let updatedGuard = await collection.findOneAndUpdate({ _id }, { $set }, { returnOriginal: false });

      updatedGuard = updatedGuard.value;

      // Throw event
      this.emit('_save', { guard: serializedGuard, updatedGuard });

      return updatedGuard;
    } else {
      throw new Errors.InternalServerError().push(cannotSaveGuard);
    }
  }

  /**
   * Add a {Guard} as a child to a parent {Guard}.
   *
   * @param {Guard} parent
   * @param {Guard} child
   * @returns {boolean}
   */
  async addInheritence(parent, child) {
    let parentGuard = null;
    let childGuard = null;

    try {
      parentGuard = await this.findByReferenceAndType(parent);
      childGuard = await this.findByReferenceAndType(child);
    } catch (error) {
      if (!(error instanceof Errors.NotFoundError)) {
        throw error;
      }
    }

    if (parentGuard) {
      if (childGuard) {
        parentGuard = await this._deserialize(parentGuard);
        childGuard = await this._deserialize(childGuard);

        // TODO: add inheritence to the guard instances.
        // if success, save the guard
        // if failed, throw error

      } else {
        let newErrorCode = guardNotFoundCode.clone();
            newErrorCode.parameter = 'child';

        throw new Errors.NotFoundError().push(newErrorCode);
      }
    } else {
      let newErrorCode = guardNotFoundCode.clone();
          newErrorCode.parameter = 'parent';

      throw new Errors.NotFoundError().push(newErrorCode);
    }
  }

  /**
   * Serialize {Guard}.
   *
   * @param {Guard|Object} guard
   * @return {Object}
   */
  _serialize(guard) {
    let _id = (guard instanceof Guard) ? guard.getId() : guard._id;
    let type = (guard instanceof Guard) ? guard.getType() : guard.type;

    if (_id && type) {
      let inheritence = [];
      let permissions = [];

      if (guard instanceof Guard) {
        guard.guards().forEach((g) => {
          inheritence.push(g.getId());
        });

        guard.permissions().forEach((p) => {
          permissions.push(p.getValue());
        });
      }

      return _.extend({}, {
        _id,
        type,
        inheritence,
        permissions,
      });
    } else {
      throw new Errors.InternalServerError().push(cannotSerializeGuard);
    }
  }

  /**
   * Deserialize object into a {Guard} instance.
   *
   * @param {Object} guard
   * @returns {Guard}
   */
  async _deserialize(guard) {
    if (guard instanceof Guard) {
      throw new Errors.InternalServerError().push(guardAlreadyDeserialized);
    } else {
      let validationErrors = [];
      let { name, type, inheritence, permissions } = guard;

      if (!(name && typeof name === 'string')) {
        validationErrors.push('name');
      }

      if (!(type && typeof type === 'string')) {
        validationErrors.push('type');
      }

      if (!(inheritence && Array.isArray(inheritence))) {
        validationErrors.push('inheritence');
      }

      if (!(type && Array.isArray(permissions))) {
        validationErrors.push('permissions');
      }

      if (validationErrors.length <= 0) {
        let instance = new Guard({ id: name, type });

        // TODO: populate instance

        return instance;
      }

      let meta = guardCannotBeCreatedCode.getMeta();
          meta.fields = validationErrors;

      throw new Errors.ValidationError().push(guardCannotBeCreatedCode.clone().setMeta(meta));
    }
  }

  /**
   * Nest the array of {Guard} objects by inheritence.
   *
   * @param {Array} guards
   * @returns {Object}
   */
  _nestGuardsByInheritence(guards) {
    // TODO:
    console.log(guards);
  }


  // TODO:

}

export default (new AuthorizationAPI());
