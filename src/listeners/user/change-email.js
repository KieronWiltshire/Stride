'use strict';

import UserAPI from '~/api/user';
import {default as createDebugger} from 'debug';

/**
 * Debugger
 */
const debug = createDebugger(UserAPI.getConfig().get('app.name') + ':' + 'listeners:user:change-email');

/**
 * Listener
 */
export default (async function({ user }) {
  UserAPI.sendEmailVerificationToken({ user }).catch(debug);
});
