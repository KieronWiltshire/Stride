'use strict';

import _ from 'lodash';
import Base from '~/api/base';
import Errors from '~/errors';
import EventEmitter from 'events';
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
export const guardCannotBeDeserializedCode = new Errors.ErrorCode('cannot_deserialize_guard', { message: 'The guard could not be deserialized' });
export const guardCannotInheritCode = new Errors.ErrorCode('cannot_inherit_guard', { message: 'The specified parent guard already inherits the specified child guard' });
export const guardDoesNotInheritCode = new Errors.ErrorCode('guard_does_not_inherit', { message: 'The specified parent guard does not directly inherit the specified child guard' });
export const failureDuringInheritenceNestingCode = new Errors.ErrorCode('failure_during_inheritence_nesting_code', { message: 'Callee failed during inheritence nesting process', level: 'SEVERE' });

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
    let lookup = [{
      $match: {
        type
      }
    }];

    if (limit) {
      limit = this.validatePaginationParameter({ type: 'limit', value: limit });
      lookup.push({ $limit: limit });
    }

    if (offset) {
      offset = this.validatePaginationParameter({ type: 'offset', value: offset });
      lookup.push({ $skip: offset });
    }

    lookup.push({ $graphLookup: {
      from: 'guards',
      startWith: '$inheritence',
      connectFromField: 'inheritence',
      connectToField: '_id',
      as: 'associatedChildren',
      depthField: 'depth'
    }});

    let result = await collection.aggregate(lookup);
        result = (await result.toArray());

    return this._nestGuardsByInheritence(result);
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
        let serializedGuard = await this._serialize(new Guard({ id: new Database.ObjectID(), type }));
        let guard = null;

        try {
          guard = await collection.insertOne(_.extend({}, serializedGuard), {
            createdAt: now,
            updatedAt: now,
          });
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
    let collection = db.collection('guards');

    let filter = {};
        filter[param] = (regex ? { $regex: value } : value);

    let result = await collection.aggregate([
      { $match: filter },
      { $graphLookup: {
          from: 'guards',
          startWith: '$inheritence',
          connectFromField: 'inheritence',
          connectToField: '_id',
          as: 'associatedChildren',
          depthField: 'depth'
      }}
    ]);

    result = (await result.toArray());

    return this._nestGuardsByInheritence(result);
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
          as: 'associatedChildren',
          depthField: 'depth'
      }}
    ]);

    result = (await result.toArray());

    if (result.length > 0) {
      let nestedResult = this._nestGuardsByInheritence(result);

      if (nestedResult.length > 1) {
        throw new Errors.InternalServerError().push(failureDuringInheritenceNestingCode);
      } else {
        return nestedResult[0];
      }
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
          as: 'associatedChildren',
          depthField: 'depth'
      }}
    ]);

    result = (await result.toArray());

    if (result.length > 0) {
      let nestedResult = this._nestGuardsByInheritence(result);

      if (nestedResult.length > 1) {
        throw new Errors.InternalServerError().push(failureDuringInheritenceNestingCode);
      } else {
        return nestedResult[0];
      }
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

      let serializedGuard = await this._serialize(guard);

      let { _id } = await this.findByReferenceAndType({ reference: serializedGuard._id, type: serializedGuard.type }); // throws not found error if the guard could not be found

      let $set = Object.assign({ updatedAt: new Date() }, serializedGuard);
          delete $set._id;

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

        if (parentGuard.equals(childGuard) || parentGuard.doesInherit(childGuard)) {
          throw new Errors.ValidationError().push(guardCannotInheritCode);
        } else {
          parentGuard.addGuard(childGuard);

          let saved = await this._save(parentGuard);

          return !!(saved);
        }
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
   * Remove a child {Guard} from it's parent {Guard}.
   *
   * @param {Guard} parent
   * @param {Guard} child
   * @returns {boolean}
   */
  async removeInheritence(parent, child) {
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

        if (parentGuard.equals(childGuard)) {
          throw new Errors.ValidationError().push(guardCannotInheritCode);
        } else if (parentGuard.hasGuard(childGuard)) {
            parentGuard.removeGuard(childGuard);

            let saved = await this._save(parentGuard);

            return !!(saved);
          } else {
            throw new Errors.ValidationError().push(guardDoesNotInheritCode);
          }
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
  async _serialize(guard) {
    let _id = (guard instanceof Guard) ? guard.getId() : guard._id;
    let type = (guard instanceof Guard) ? guard.getType() : guard.type;

    if (_id && type) {
      let inheritence = [];
      let permissions = [];

      if (guard instanceof Guard) {
        let ops = [];

        guard.guards().forEach((g) => {
          ops.push(this.findByReferenceAndType({ reference: g.getId(), type: g.getType() }));
        });

        (await Promise.all(ops)).forEach((childGuard) => {
          inheritence.push(childGuard._id);
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
      let meta = guardCannotBeDeserializedCode.getMeta();

      if (guard) {
        let validationErrors = [];
        let { reference, type, inheritence, permissions } = guard;

        if (!(reference && typeof reference === 'string')) {
          validationErrors.push('reference');
        }

        if (!(type && typeof type === 'string')) {
          validationErrors.push('type');
        }

        if (!(inheritence && Array.isArray(inheritence))) {
          validationErrors.push('inheritence');
        }

        if (!(permissions && Array.isArray(permissions))) {
          validationErrors.push('permissions');
        }

        if (validationErrors.length <= 0) {
          let instance = new Guard({ id: reference, type });
          let children = [];

          inheritence.forEach((child) => {
            children.push(this._deserialize(inheritence[child]));
          });

          (await Promise.all(children)).forEach((childGuard) => {
            instance.addGuard(childGuard);
          });

          permissions.forEach((p) => {
            instance.addPermission(p);
          });

          return instance;
        } else {
          meta.fields = validationErrors;
        }
      }

      throw new Errors.ValidationError().push(guardCannotBeDeserializedCode.clone().setMeta(meta));
    }
  }

  /**
   * Nest the array of {Guard} objects by inheritence.
   *
   * @param {Array} guards
   * @returns {Object}
   */
  _nestGuardsByInheritence(guards) {
    for (let i = 0; i < guards.length; i++) {
      let g = guards[i];

      g.associatedChildren = g.associatedChildren.sort((a, b) => (a.depth < b.depth));

      let depth = 0;

      g.associatedChildren.forEach((ac) => {
        depth = (ac.depth > depth) ? ac.depth : depth;
      });

      while (depth >= 0) {
        for (let n = 0; n < g.associatedChildren.length; n++) {
          let ac = g.associatedChildren[n];

          if (ac.depth === (depth - 1)) {
            let directChildren = [];

            ac.inheritence.forEach((inheritenceId) => {
              for (let m = 0; m < g.associatedChildren.length; m++) {
                let ac2 = g.associatedChildren[m];
                if (inheritenceId.equals(ac2._id)) {
                  let dc = _.extend({}, ac2);
                  delete dc.depth;

                  directChildren.push(dc);
                }
              }
            });

            ac.inheritence = directChildren;
          }
        }

        depth--;
      }
    }

    let parents = [];

    for (let i = 0; i < guards.length; i++) {
      let g = guards[i];

      if (guards.length > 1) {
        for (let n = 0; n < g.associatedChildren.length; n++) {
          let ac = g.associatedChildren[n];

          if (Array.isArray(g.inheritence)) {
            g.inheritence.forEach((inheritenceId) => {
              if (inheritenceId.equals(ac._id)) {
                let p = _.extend({}, g);
                    p.inheritence = ac;
                    delete p.associatedChildren;

                parents.push(p);
              }
            });
          } else if (g.inheritence.equals(ac._id)) {
            let p = _.extend({}, g);
                p.inheritence = ac;
                delete p.associatedChildren;

            parents.push(p);
          }
        }
      } else {
        let p = _.extend({}, g);
            delete p.associatedChildren;

        parents.push(p);
      }
    }

    let combined = [];

    for (let i = 0; i < parents.length; i++) {
      let p = parents[i];
      let add = false;

      delete p.inheritence.depth;

      if (combined.length > 0) {
        combined.forEach((c) => {
          if (p._id.equals(c._id)) {
            c.inheritence.push(p.inheritence);
          } else {
            add = true;
          }
        });
      } else {
        add = true;
      }

      if (add) {
        let a = _.extend({}, p);

        if (!Array.isArray(p.inheritence)) {
          a.inheritence = [p.inheritence];
        }

        combined.push(a);
      }
    }

    return combined;
  }

}

export default (new AuthorizationAPI());
