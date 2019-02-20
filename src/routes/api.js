'use strict';

import Express from 'express';
import * as Database from '~/database';

import AuthorizationAPI from '~/api/authorization';

const router = Express.Router();

AuthorizationAPI.findById({
  _id: '5c6d82c33d018832b8844bb8'
});

export default router;
