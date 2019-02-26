'use strict';

/**
 * The 'up' method is called on migration.
 *
 * @param {Database} database The MongoClient database instance
 * @returns {Promise}
 */
export const up = async function(database) {
  let collection = await database.createCollection('users');

  return Promise.all([
    collection.createIndex({
      email: 1
    }, {
      unique: true
    }),
    collection.createIndex({
      username: 1
    }, {
      unique: true
    })
  ]);
};

/**
 * The 'down' method is called on rollback.
 *
 * @param {Database} database The MongoClient database instance
 * @returns {Promise}
 */
export const down = async function(database) {
  let collection = await database.collection('users');

  return collection.drop();
};
