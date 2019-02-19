'use strict';

import UserAPI from '~/api/user';

import UserCreated from '~/listeners/user/create';
import UserChangeEmail from '~/listeners/user/change-email';
import UserForgotPassword from '~/listeners/user/forgot-password';

/**
 * User Listeners
 */
UserAPI.on('create', UserCreated);
UserAPI.on('forgotPassword', UserForgotPassword);
UserAPI.on('changeEmail', UserChangeEmail);
