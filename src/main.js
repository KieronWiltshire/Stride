'use strict';

import Cors from 'cors';
import Helmet from 'helmet';
import Logger from 'morgan';
import Router from '~/router';
import BodyParser from 'body-parser';
import CookieParser from 'cookie-parser';
import MethodOverride from 'method-override';
import {default as Application, config} from '~/app';
import ErrorResponse from '~/errors/response';

/**
 * Begin listening for events
 */
import '~/listeners';

/**
 * Serve the favicon
 */
// let faviconPath = Path.join(publicDir, 'favicon.ico');
// if (Fs.existsSync(faviconPath)) {
//   Application.use(favicon(faviconPath));
// }

/**
 * Global Middleware
 */
if (process.env.NODE_ENV !== 'testing') {
  Application.use(Logger('dev'));
}

Application.use(BodyParser.json());
Application.use(BodyParser.urlencoded({ 'extended': true }));
Application.use(CookieParser(config.get('app.key', null), {
  'httpOnly': true,
  'secure': config.get('app.secure', false)
}));
Application.use(Helmet());
Application.use(MethodOverride('X-HTTP-Method-Override'));
Application.use(Cors());

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
