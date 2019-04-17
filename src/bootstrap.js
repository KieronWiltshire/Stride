'use strict';

import Router from '~/router';
import Application from '~/app';
import ErrorResponse from '~/errors/response';

/**
 * Begin listening for events
 */
import '~/listeners';

/**
 * Apply the application router before booting the application.
 */
Application.use('/', Router);

/**
 * Apply an application error response handler
 */
Application.use(ErrorResponse.handler);

/**
 * Exports
 */
export * from '~/app';
export * from '~/socket';
