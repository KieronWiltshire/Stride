'use strict';

import Base from '~/api/base';
import UserAPI from '~/api/user';
import Errors from '~/errors';
import JWT from 'jsonwebtoken';
import EventEmitter from 'events';

/**
 * Error codes.
 */
export const tokenInvalidCode = new Errors.ErrorCode('token_invalid', { message: '' });
export const tokenMalformedCode = new Errors.ErrorCode('token_malformed', { message: 'The specified token does not match the initial blueprint' });
export const tokenExpiredCode = new Errors.ErrorCode('token_expired', { message: 'The specified token is no longer valid' });
export const tokenRequiredCode = new Errors.ErrorCode('token_required', { message: 'An authorization token is required' });

/**
 * Authentication API
 */
class AuthenticationAPI extends Base {

  /**
   * Create a new {AuthenticationAPI} instance.
   */
  constructor() {
    super('authentication');
    EventEmitter.call(this);
  }

  /**
   * Generate an authentication token based on
   * the user supplied id supplied.
   *
   * @param {number|string} subject The user's unique identifier
   * @returns {string} token
   */
  generate({ subject }) {
    let payload = {
      'sub': subject,
      'iat': Date.now()
    };

    // Get the jwt options
    let jwtOptions = this.getConfig().get('jwt', {});
    let allowedJwtOptions = [
      'expiresIn'
    ];

    // Only allow permitted options
    for (let key in jwtOptions) {
      if (allowedJwtOptions.indexOf(jwtOptions[key]) === -1) {
        delete jwtOptions[key];
      }
    }

    jwtOptions = Object.assign({
      issuer: this.getURL(),
      audience: this.getURL()
    });

    // Sign payload with jwt options
    let token = JWT.sign(payload, this.getConfig().get('app.key'), jwtOptions);
    this.emit('generate', subject, token);

    return token;
  }

  /**
   * Refresh an authentication token based on
   * the previous token.
   *
   * @param {string} token The authorization token
   * @returns {Promise<string>} token
   */
  async refresh({ token }) {
    try {
      if (token) {
        let decodedToken = await this.verify(token);
        let toleranceDays = this.getConfig().get('jwt.toleranceDays', 7);

        let limitDate = new Date(decodedToken.exp * 1000);
        limitDate.setDate(limitDate.getDate() + toleranceDays);

        if (Math.floor(Date.now() / 1000) >= Math.floor(limitDate / 1000)) {
          throw new Errors.UnauthorizedError().push(tokenExpiredCode);
        } else {
          decodedToken.iat = Date.now();

          let token = JWT.sign(decodedToken, this.getConfig().get('app.key'), this.getConfig().get('jwt', {}));
          this.emit('refresh', decodedToken.user, token);
          return Promise.resolve(token);
        }
      } else {
        throw new Errors.UnauthorizedError().push(tokenRequiredCode);
      }
    } catch (error) {
      this.debug(error);
      return Promise.reject(error);
    }
  }

  /**
   * Determines the validity of the specified token.
   *
   * @param {string} token The authorization token
   * @returns {Promise<Object>} decoded token
   */
  async verify({ token }) {
    try {
      if (token) {
        let decodedToken = JWT.verify(token, this.getConfig().get('app.key'));
        if (decodedToken.sub) {
          let user = await UserAPI.findById(decodedToken.sub);

          decodedToken.sub = user;
          decodedToken.iat = new Date(decodedToken.iat);

          if (decodedToken.iat >= user.sessionsValidAfter) {
            return Promise.resolve(decodedToken);
          } else {
            throw new Errors.UnauthorizedError().push(tokenExpiredCode);
          }
        } else {
          throw new Errors.ValidationError().push(tokenMalformedCode);
        }
      } else {
        throw new Errors.UnauthorizedError().push(tokenRequiredCode);
      }
    } catch (error) {
      this.debug(error);

      if (error instanceof JWT.JsonWebTokenError) {
        let errorCode = new Errors.ErrorCode(tokenInvalidCode.code, { message: error.message });

        throw new Errors.ValidationError().push(errorCode);
      } else {
        throw error;
      }
    }
  }

}

export default (new AuthenticationAPI());
