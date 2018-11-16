'use strict';

import Path from 'path';
import Respondent from 'respondent';
import Env from '~/env';
import NodeMailer from 'nodemailer';

/**
 * Load configurations
 */
const config = new Respondent({ rootDir: Path.join(__dirname, 'config'), env: Env });

// Mail transport
let transport = null;

/**
 * Retrieve the email transporter.
 *
 * @returns {NodeMailer}
 */
export const getTransport = (async function() {
  if (!transport) {
    let host = config.get('mail.host', 'smtp.ethereal.email');
    let port = config.get('mail.port', 587);
    let secure = config.get('mail.secure', false);
    let user = config.get('mail.username', 'no-reply@example.com');
    let pass = config.get('mail.password', '');

    if (process.env.NODE_ENV.toLowerCase() !== 'production') {
      let account = await NodeMailer.createTestAccount();

      host = account.smtp.host;
      port = account.smtp.port;
      secure = account.smtp.secure;
      user = account.user;
      pass = account.pass;
    }

    transport = NodeMailer.createTransport({ host, port, secure, auth: { user, pass }});
  }

  return transport;
});
