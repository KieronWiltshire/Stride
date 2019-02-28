'use strict';

import OS from 'os';
import Path from 'path';
import Bootit from 'bootit';
import Greenlock from 'greenlock';
import {Application, config, io} from '~/main';

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
