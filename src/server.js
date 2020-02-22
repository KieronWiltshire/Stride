'use strict';

import OS from 'os';
import Path from 'path';
import Bootit from 'bootit';
import Greenlock from 'greenlock';
import Config from '~/config';
import {Application, io} from '~/bootstrap';

/**
 * Bootstrap
 */
let options = {
  io,
  redirectToHttps: true
};

if (Config.get('http.secure', false)) {
  if (Config.get('greenlock.enabled', true)) {
    options.greenlock = Greenlock.create({
      agreeTos: true,
      email: Config.get('greenlock.email', 'user@example.com'),
      approveDomains: Config.get('greenlock.approveDomains', [ 'example.com' ]),
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

/**
 * Start server
 */
export const Server = Bootit.start(Application, options);

export default Server;