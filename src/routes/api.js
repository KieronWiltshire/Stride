'use strict';

import Express from 'express';

import AuthorizationAPI from '~/api/authorization';

const router = Express.Router();

AuthorizationAPI.findByReferenceAndType({
  reference: 'admin',
  type: 'role'
});

export default router;
