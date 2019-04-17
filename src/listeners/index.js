'use strict';

import UserAPI from '~/api/user';

import SendEmailVerificationToken from '~/listeners/user/send-email-verification-token';
import SendPasswordResetToken from '~/listeners/user/send-password-reset-token';

/**
 * User Listeners
 */
UserAPI.on('create', SendEmailVerificationToken);
UserAPI.on('forgotPassword', SendPasswordResetToken);
UserAPI.on('changeEmail', SendEmailVerificationToken);
