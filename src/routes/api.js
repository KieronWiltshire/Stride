'use strict';

import Express from 'express';
import UserAPI from '~/api/user'

const router = Express.Router();

router.get('/test', async function(req, res) {
  let b = await UserAPI.index();
  res.json(b);
})

export default router;
