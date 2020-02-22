/* eslint-disable require-atomic-updates */

'use strict';

import Config from '~/config';
import NodeMailer from 'nodemailer';

// Mail transport
let transport = null;

/**
 * Retrieve the email transporter.
 *
 * @returns {NodeMailer}
 */
export default async function() {
  if (!transport) {
    let host = Config.get('mail.host', 'smtp.ethereal.email');
    let port = Config.get('mail.port', 587);
    let secure = Config.get('mail.secure', false);
    let user = Config.get('mail.username', 'no-reply@example.com');
    let pass = Config.get('mail.password', '');

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
}
