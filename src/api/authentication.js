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
export const tokenSubjectNotFoundCode = new Errors.ErrorCode('token_subject_not_found', { message: 'Unable to find the calling subject' });
export const invalidSubjectType = new Errors.ErrorCode('invalid_subject_type', { message: 'An invalid subject type was specified' });

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
   * @param {number|string} subject The subject's unique identifier
   * @param {string} subjectType The type of the specified subject
   * @returns {string} token
   */
  generate({ subject, subjectType }) {
    let payload = {
      'sub': subject,
      'iat': Date.now()
    };

    // Add the subject type to the payload
    if (subjectType) {
      if (typeof subjectType === 'string') {
        payload.subtyp = subjectType.toLowerCase();
      } else {
        throw new Errors.InternalServerError().push(invalidSubjectType);
      }
    }

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
          this.emit('refresh', decodedToken.sub, token);
          return token;
        }
      } else {
        throw new Errors.UnauthorizedError().push(tokenRequiredCode);
      }
    } catch (error) {
      this.debug(error);

      throw error;
    }
  }

  /**
   * Determines the validity of the specified token.
   *
   * @param {string} token The authorization token
   * @returns {Promise<Object>} decoded token
   */
  async verify({ token }) {
    if (token) {
      let decodedToken = null;

      try {
        decodedToken = JWT.verify(token, this.getConfig().get('app.key'));
      } catch (error) {
        this.debug(error);

        if (error instanceof JWT.JsonWebTokenError) {
          let errorCode = new Errors.ErrorCode(tokenInvalidCode.code, { message: error.message });

          throw new Errors.ValidationError().push(errorCode);
        } else {
          throw error;
        }
      }

      if (decodedToken && decodedToken.sub) {
        let subject = null;
        let jwtValidAfter = null;

        if (decodedToken.subtyp && decodedToken.subtyp.toLowerCase() === 'user') {
          try {
            subject = await UserAPI.findById(decodedToken.sub);
            jwtValidAfter = subject.sessionsValidAfter;
          } catch (error) {
            this.debug(error);

            throw new Errors.NotFoundError().push(tokenSubjectNotFoundCode);
          }
        }

        decodedToken.sub = (subject) ? subject : decodedToken.sub;
        decodedToken.iat = new Date(decodedToken.iat);

        if (jwtValidAfter) {
          if (decodedToken.iat >= jwtValidAfter) {
            return decodedToken;
          } else {
            throw new Errors.UnauthorizedError().push(tokenExpiredCode);
          }
        } else {
          return decodedToken;
        }
      } else {
        throw new Errors.ValidationError().push(tokenMalformedCode);
      }
    } else {
      throw new Errors.UnauthorizedError().push(tokenRequiredCode);
    }
  }

}

export default (new AuthenticationAPI());
