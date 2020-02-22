'use strict';

import Database from '~/database';
import Mogront from 'mogront';
import MogrontConfig from '../mogront.config.js';
import Config from '~/config';

/**
 * Begin tests
 */
describe('Tests', () => {

  /**
   * Pretest setup
   */
  before((done) => {
    try {
      Database.connect(async function(err, client) {
        if (err) {
          throw done(err);
        }

        let db = client.db(Config.get('database.database', 'stride'));

        if (await db.dropDatabase()) {
          let m = new Mogront(null, MogrontConfig);

          await m.migrate();
        }

        done();
      });
    } catch (error) {
      done(error);
    }
  });

  /**
   * Example test cases
   */
  describe('example tests', () => {
    it('should do something to test something ...', (done) => {
      done();
    });
  });

});
