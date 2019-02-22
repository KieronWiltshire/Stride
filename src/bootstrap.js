'use strict';

import OS from 'os';
import Path from 'path';
import Env from '~/env';
import Bootit from 'bootit';
import Router from '~/router';
import Greenlock from 'greenlock';
import Respondent from 'respondent';
import ErrorResponse from '~/errors/response';
import {default as Application, io} from '~/app';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

/**
 * Apply the application router before booting the application.
 */
Application.use('/', Router);

/**
 * Apply an application error response handler
 */
Application.use(ErrorResponse.handler);

/**
 * Bootstrap
 */
let options = {
  io: io,
  redirectToHttps: true
};

if (config.get('http.secure', false)) {
  if (config.get('greenlock.enabled', true)) {
    options.greenlock = Greenlock.create({
      agreeTos: true,
      email: config.get('greenlock.email', 'user@example.com'),
      approveDomains: config.get('greenlock.approveDomains', [ 'example.com' ]),
      communityMember: true,
      version: 'draft-12',
      server: process.env.NODE_ENV === 'production' ? 'https://acme-v02.api.letsencrypt.org/directory' : 'https://acme-staging-v02.api.letsencrypt.org/directory',
      configDir: Path.join(OS.homedir(), 'acme/etc'),
    });
  } else {
    options.key = config.get('http.secureKeyPath', Path.join(__dirname, '..', 'key.pem'));
    options.certificate = config.get('http.secureCertPath', Path.join(__dirname, '..', 'certificate.pem'));
  }
}

Bootit.start(Application, options);
