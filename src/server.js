'use strict';

import OS from 'os';
import Path from 'path';
import Bootit from 'bootit';
import Greenlock from 'greenlock';
import Config from '~/config';
import {Application, io} from '~/bootstrap';
import Database from '~/database';
import {default as createDebugger} from 'debug';

/**
 * Debugger
 */
const debug = createDebugger(Config.get('app.name') + ':' + 'server');

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
    options.key = Config.get('http.secureKeyPath', Path.join(__dirname, '..', 'key.pem'));
    options.certificate = Config.get('http.secureCertPath', Path.join(__dirname, '..', 'certificate.pem'));
  }
}

/**
 * Connect to the database.
 */
Database.connect(async function(err) {
  debug(err);
});

/**
 * Start server.
 */
export const Server = Bootit.start(Application, options);

/**
 * Export server.
 */
export default Server;
