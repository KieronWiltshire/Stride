'use strict';

import Express from 'express';
import AuthorizationAPI from '~/api/authorization';

const router = Express.Router();

AuthorizationAPI.findByReferenceAndType({
  reference: 'superadmin',
  type: 'role'
})
.then((guard) => AuthorizationAPI.addInheritence(guard, null))
.then((res) => console.log(JSON.stringify(res, null, 2)))
.catch((err) => console.log(err));

export default router;
