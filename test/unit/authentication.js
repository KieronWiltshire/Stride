'use strict';

/* eslint-disable */

import * as Chai from 'chai';
import HTTPMock from 'node-mocks-http';

import Context from '~/utilities/context';
import UserAPI from '~/api/user';
import AuthenticationAPI from '~/api/authentication';
import AuthenticationMiddleware from '~/middleware/authentication';

/**
 * Authentication Unit Test Suite
 */
export default () => {

  it('should do something to test authentication middleware ...', (done) => {
    let token = AuthenticationAPI.generate({ subject: 1 });

    let request = Context(HTTPMock.createRequest({
      method: 'GET',
      headers: {
        authorization: 'Bearer '.concat(token)
      }
    }));

    let response = HTTPMock.createResponse();

    AuthenticationMiddleware(request, response, (error) => {
      if (!error) {
        // chai
      }

      done(error);
    });
  });

};
