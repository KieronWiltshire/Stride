'use strict';

import Express from 'express';
import UserAPI from '~/api/user';
import AuthorizationAPI from '~/api/authorization';

// UserAPI.create({ username: 'theholymale', password: 'theholymale', email: 'theholymale@theholymale.com' }).then(console.log).catch(console.log);
// UserAPI.edit({ user: {_id: '5c0402f6ff33270890772608'}, data: {username: 'theholymale1999'} }).then(console.log).catch(console.log);

const router = Express.Router();

export default router;
