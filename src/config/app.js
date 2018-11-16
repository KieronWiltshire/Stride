'use strict';

/**
 * Application configuration
 */

var options = {};

/**
 * The name of your application
 */
options['name'] = process.env.APP_NAME || 'app';

/**
 * Prettify response output
 */
options['prettify'] = process.env.APP_PRETTIFY || true;

/**
 * Application key
 */
options['key'] = process.env.APP_KEY || 'superSecretApplicationKey';

/**
 * Run the application behind a proxy server
 */
options['behindProxy'] = (process.env.APP_BEHIND_PROXY !== null) ? process.env.APP_BEHIND_PROXY : false;

/**
 * The view engine that handles the rendering of templates
 */
options['viewEngine'] = process.env.APP_VIEW_ENGINE || 'pug';

/**
 * The url that will point to this web application.
 *
 * WARNING:
 *  DO NOT ADD A TRAILING SLASH TO THE END OF THE URL.
 *
 */
options['url'] = process.env.APP_URL || 'www.example.com';

/**
 * Ensure configuration is correct:
 */
{
  /* URL */ {
    let urlLength = options['url'].length;

    // Remove trailing slashes
    while(options['url'][(urlLength - 1)] === '/') {
      options['url'] = options['url'].substring(0, urlLength - 1);
      urlLength--;
    }
  }
}

export default options;
