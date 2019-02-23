'use strict';

import Chai from 'chai';
import HTTPMock from 'node-mocks-http';

import Context from '~/utilities/context';
import AuthenticationAPI from '~/api/authentication';
import AuthenticationMiddleware from '~/middleware/authentication';

describe('authentication', () => {

  it('...', (done) => {
    let token = AuthenticationAPI.generate({ subject: 1 });

    AuthenticationMiddleware(
      Context(HTTPMock.createRequest({
        method: 'GET',
        headers: {
          authorization: 'Bearer '.concat(token)
        }
      })),
      HTTPMock.createResponse(),
      (request) => {
        let error = (request instanceof Error) ? request : null;

        // TODO:

        done(error);
      }
    );
  });

});
