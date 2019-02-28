'use strict';

import Path from 'path';
import Env from '~/env';
import * as Database from '~/database';
import Mogront from 'mogront';
import MogrontConfig from '../mogront.config.js';
import Respondent from 'respondent';

// Unit Tests
import UserUnitTests from './unit/user';
import AuthenticationUnitTests from './unit/authentication';

// Integration Tests
import UserIntegrationTests from './integration/user';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, '..', 'config'), env: Env });

/**
 * Begin tests
 */
describe('Tests', () => {

  /**
   * Pretest setup
   */
  before(async () => {
    let connection = await Database.getConnection();
    let db = connection.db(config.get('database.database', 'stride'));

    if (await db.dropDatabase()) {
      let m = new Mogront(null, MogrontConfig);

      return m.migrate();
    } else {
      return true;
    }
  });

  /**
   * Unit Test suites
   */
  describe('user unit tests', UserUnitTests);
  describe('authentication unit tests', AuthenticationUnitTests);

  /**
   * Integration suites
   */
  describe('user integration tests', UserIntegrationTests);

});
