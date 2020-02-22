'use strict';

import Router from '~/router';
import Application from '~/app';
import Errors from '~/errors';

/**
 * Apply the application router before booting the application.
 */
Application.use('/', Router);

/**
 * Apply an application error response handler
 */
Application.use(Errors.handler);

/**
 * Exports
 */
export * from '~/app';
export * from '~/socket';
