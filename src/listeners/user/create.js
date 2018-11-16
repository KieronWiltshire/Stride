'use strict';

import {default as createDebugger} from 'debug';
import UserAPI from '~/api/user';

/**
 * Debugger
 */
const debug = createDebugger(UserAPI.getConfig().get('app.name') + ':' + 'listeners:user:create');

/**
 * Listener
 */
export default (async function({ user }) {
  UserAPI.sendEmailVerificationToken({ user }).catch(debug);
});
