'use strict';

import _ from 'lodash';
import EventEmitter from 'events';
import Validator from 'validator';
import Errors from '~/errors';
import Database from '~/database';
import Bcrypt from 'bcrypt';
import RandomString from 'randomstring';
import * as Mailer from '~/mailer';
import Base from './base';

/**
 * Error codes.
 */
export const userNotFoundCode = new Errors.ErrorCode('user_not_found', { message: 'The specified user could not be found' });
export const userCannotBeCreatedCode = new Errors.ErrorCode('cannot_create_user', { message: 'The user could not be created' });
export const userCannotBeUpdatedCode = new Errors.ErrorCode('cannot_update_user', { message: 'The user could not be updated' });
export const unableToSendPasswordResetTokenCode = new Errors.ErrorCode('unable_to_send_password_reset_token', { message: 'Unable to send the password reset token' });
export const userPasswordResetTokenMismatchCode = new Errors.ErrorCode('password_reset_token_mismatch', { message: 'The password could not be reset because the specified token is invalid' });
export const userPasswordResetTokenExpiredCode = new Errors.ErrorCode('password_reset_token_expired', { message: 'The password could not be reset because the specified token has expired' });
export const unableToSendEmailVerificationTokenCode = new Errors.ErrorCode('unable_to_send_email_verification_token', { message: 'Unable to send the email verification token' });
export const userEmailVerificationTokenMismatchCode = new Errors.ErrorCode('email_verification_token_mismatch', { message: 'The email could not be verified because the specified token is invalid' });

/**
 * User API
 */
class UserAPI extends Base {

  /**
   * Create a new {UserAPI} instance.
   */
  constructor() {
    super('user');
    EventEmitter.call(this);
  }

  /**
   * Retrieve {User} index.
   *
   * @param {number} limit
   * @param {number} offset
   * @returns {Array<User>}
   */
  async index({ limit, offset } = {}) {
    let collection = Database.get('users');
    let options = {};

    if (limit) {
      options.limit = this.validatePaginationParameter({ type: 'limit', value: limit });
    }

    if (offset) {
      options.skip = this.validatePaginationParameter({ type: 'offset', value: offset });
    }

    return collection.find({}, options);
  }

  /**
   * Create a new {User}.
   *
   * @param {string} email
   * @param {string} username
   * @param {string} password
   * @returns {User}
   */
  async create({ email, username, password }) {
    let validationErrors = [];

    if (email && Validator.isEmail(email)) {
      email = Validator.normalizeEmail(email);
    } else {
      validationErrors.push('email');
    }

    if (password && Validator.isLength(password, { min: 6 })) {
      password = await Bcrypt.hash(password, this.getConfig().get('user.passwordHashRounds', 10));
    } else {
      validationErrors.push('password');
    }

    if (!(username && Validator.isLength(username, {min: 1}) && Validator.isAlphanumeric(username))) {
      validationErrors.push('username');
    }

    if (validationErrors.length <= 0) {
      let collection = Database.get('users');
      let exists = [] = await collection.find({ $or: [{ username }, { email }] });

      if (exists.length <= 0) {
        let now = new Date();

        let user = await collection.insert({
          email,
          username,
          password,
          passwordResetToken: this.generatePasswordResetToken(),
          emailVerificationToken: this.generateEmailVerificationToken({ email }),
          emailVerified: false,
          sessionsValidAfter: now,
          createdAt: now,
          updatedAt: now,
        });

        // Throw event
        this.emit('create', { user });

        return user;
      } else {
        for (let record of exists) {
          if ((record.username) && (record.username.toLowerCase() === username.toLowerCase()) && (validationErrors.indexOf('username') < 0)) {
            validationErrors.push('username');
          }
          if ((record.email) && (record.email === email) && (validationErrors.indexOf('email') < 0)) {
            validationErrors.push('email');
          }
          if ((validationErrors.indexOf('email') >= 0) && (validationErrors.indexOf('username') >= 0)) {
            break;
          }
        }
      }
    }

    let meta = userCannotBeCreatedCode.getMeta();
        meta.fields = validationErrors;

    throw new Errors.ValidationError().push(userCannotBeCreatedCode.clone().setMeta(meta));
  }

  /**
   * Find a {User} by identifier.
   *
   * @param {string} id
   * @returns {User}
   */
  async findById({ id }) {
    let collection = Database.get('users');
    let result = await collection.findOne({ _id: id });

    if (result) {
      return result;
    } else {
      throw new Errors.NotFoundError().push(userNotFoundCode);
    }
  }

  /**
   * Find a {User} by username.
   *
   * @param {string} username
   * @returns {User}
   */
  async findByUsername({ username }) {
    let collection = Database.get('users');
    let result = await collection.findOne({ username });

    if (result) {
      return result;
    } else {
      throw new Errors.NotFoundError().push(userNotFoundCode);
    }
  }

  /**
   * Find a {User} by email.
   *
   * @param {string} email
   * @returns {User}
   */
  async findByEmail({ email }) {
    let collection = Database.get('users');
    let result = await collection.findOne({ email });

    if (result) {
      return result;
    } else {
      throw new Errors.NotFoundError().push(userNotFoundCode);
    }
  }

  /**
   * Find a {User} by an unknown parameter.
   *
   * @param {number|string} param
   * @param {number|string} value
   * @param {boolean} regex
   * @returns {User}
   */
  async find({ param, value, regex = true } = {}) {
    let collection = Database.get('users');

    let filter = {};
        filter[param] = (regex ? { $regex: value } : value);

    return await collection.find(filter);
  }

  /**
   * Edit a {User}'s details.
   *
   * @param {User} user
   * @param {Object} data
   * @returns {User}
   */
  async edit({ user, data }) {
    let { _id } = user;
    let { email, password, username } = data;
    let update = Object.assign({ updatedAt: new Date() }, user);
    let validationErrors = [];

    if (email) {
      if (Validator.isEmail(email)) {
        update.email = email = Validator.normalizeEmail(email);
      } else {
        validationErrors.push('email');
      }
    }

    if (password) {
      if (Validator.isLength(password, { min: 6 })) {
        update.password = password = await Bcrypt.hash(password, this.getConfig().get('user.passwordHashRounds', 10));
      } else {
        validationErrors.push('password');
      }
    }

    if (username) {
      if (Validator.isLength(username, {min: 1}) && Validator.isAlphanumeric(username)) {
        update.username = username;
      } else {
        validationErrors.push('username');
      }
    }

    if (validationErrors.length <= 0) {
      let collection = Database.get('users');
      let $or = [];

      if (email) {
        $or.push({ email });
      }

      if (username) {
        $or.push({ username });
      }

      let exists = [] = await collection.find({ $or });

      if (exists.length <= 0) {
        let updatedUser = await collection.findOneAndUpdate({ _id }, update);

        // Throw event
        this.emit('edit', { user, updatedUser });

        return updatedUser;
      } else {
        for (let record of exists) {
          if ((validationErrors.indexOf('email') >= 0) && (validationErrors.indexOf('username') >= 0)) {
            break;
          }
          if ((record.username) && (record.username.toLowerCase() === username.toLowerCase()) && (validationErrors.indexOf('username') < 0)) {
            validationErrors.push('username');
          }
          if ((record.email) && (record.email === email) && (validationErrors.indexOf('email') < 0)) {
            validationErrors.push('email');
          }
        }
      }
    }

    let meta = userCannotBeUpdatedCode.getMeta();
        meta.fields = validationErrors;

    throw new Errors.ValidationError().push(userCannotBeUpdatedCode.clone().setMeta(meta));
  }

  /**
   * Create's a password reset token for the specified {User}.
   *
   * @param {User} user
   * @return {User}
   */
  async forgotPassword({ user }) {
    let { _id } = user;
    let collection = Database.get('users');

    user = await collection.findOneAndUpdate({ _id }, Object.assign({
      updatedAt: new Date(),
      passwordResetToken: this.generatePasswordResetToken()
    }, user));

    // Throw event
    this.emit('forgotPassword', { user });

    return user;
  }

  /**
   * Send the password reset email.
   *
   * @param {User} user
   * @returns {boolean}
   */
  async sendPasswordResetToken({ user }) {
    let transport = await Mailer.getTransport();
    let url = this.getUrl();
    let html = await this.render({
      view: 'emails.user.password-reset',
      data: {
        url,
        user,
      }
    });

    let mailOptions = {
      from: this.getConfig().get('mail.sender', 'no-reply@example.com'),
      to: user.email,
      subject: 'Password Reset',
      html
    };

    try {
      transport.sendMail(options);
    } catch (error) {
      throw new Errors.InternalServerError().push(unableToSendPasswordResetTokenCode);
    }
  }

  /**
   * Reset the {User}'s password using the password reset token.
   *
   * @param {User} user
   * @param {string} password
   * @param {string} passwordResetToken
   * @return {User}
   */
  async resetPassword({ user, password, passwordResetToken }) {
    let { _id } = user;
    let now = new Date();
    let update = Object.assign({ updatedAt: now, sessionsValidAfter: now }, user);

    if (user.passwordResetToken === passwordResetToken) {
      let decodedToken = this.parsePasswordResetToken({ passwordResetToken });

      // check it has not expired
      if (Validator.isAfter(decodedToken.expiry, new Date())) {
        let collection = Database.get('users');
        let updatedUser = await collection.findOneAndUpdate({ _id }, Object.assign({
          password
        }, update));

        // Throw event
        this.emit('resetPassword', { user, updatedUser });

        return updatedUser;
      } else {
        throw new Errors.ValidationError().push(userPasswordResetTokenExpiredCode);
      }
    } else {
      throw new Errors.ValidationError().push(userPasswordResetTokenMismatchCode);
    }
  }

  /**
   * Verify a {User}'s password.
   *
   * @param {User} user
   * @param {string} password
   * @returns {User}
   */
  async verifyPassword({ user, password }) {
    return await Bcrypt.compare(password, user.password);
  }

  /**
   * Generate a password reset token.
   *
   * @returns {string}
   */
  generatePasswordResetToken() {
    let expiry = new Date();
        expiry.setSeconds(expiry.getSeconds() + this.getConfig().get('user.passwordResetTokenExpiry', (60 * 60 * 24 * 1)));

    return Buffer.from(JSON.stringify({ expiry, token: RandomString.generate(32)})).toString('base64');
  }

  /**
   * Parse an password reset token.
   *
   * @param {string} passwordResetToken
   * @returns {Object}
   */
  parsePasswordResetToken({ passwordResetToken }) {
    return JSON.parse(Buffer.from(passwordResetToken, 'base64'));
  }

  /**
   * Change the email of the specified {User}.
   *
   * @param {User} user
   * @param {string} email
   * @returns {boolean}
   */
  async changeEmail({ user, email }) {
    let { _id } = user;
    let validationErrors = [];

    if (email && Validator.isEmail(email)) {
      email = Validator.normalizeEmail(email);
    } else {
      validationErrors.push('email');
    }

    if (validationErrors.length <= 0) {
      let collection = Database.get('users');
      let exists = [] = await collection.find({ email });

      if (exists.length <= 0) {
        user = await collection.findOneAndUpdate({ _id }, Object.assign({
          updatedAt: new Date(),
          emailVerificationToken: this.generateEmailVerificationToken({ email })
        }, user));

        // Throw event
        this.emit('changeEmail', { user });

        return user;
      } else {
        for (let record of exists) {
          if ((record.email) && (record.email === email)) {
            validationErrors.push('email');
            break;
          }
        }
      }
    }

    let meta = userCannotBeUpdatedCode.getMeta();
        meta.fields = validationErrors;

    throw new Errors.ValidationError().push(userCannotBeUpdatedCode.clone().setMeta(meta));
  }

  /**
   * Send the email verification email.
   *
   * @param {User} user
   * @returns {boolean}
   */
  async sendEmailVerificationToken({ user }) {
    let transport = await Mailer.getTransport();
    let url = this.getUrl();
    let html = await this.render({
      view: 'emails.user.email-verification',
      data: {
        url,
        user,
      }
    });

    let mailOptions = {
      from: this.getConfig().get('mail.sender', 'no-reply@example.com'),
      to: user.email,
      subject: 'Email Verification',
      html
    };

    try {
      transport.sendMail(options);
    } catch (error) {
      throw new Errors.InternalServerError().push(unableToSendEmailVerificationTokenCode);
    }
  }

  /**
   * Verify the email using the specified email verification token.
   *
   * @param {User} user
   * @param {string} emailVerificationToken
   * @return {User}
   */
  async verifyEmail({ user, emailVerificationToken }) {
    let update = Object.assign({ updatedAt: new Date() }, user);
    let { _id } = user;

    if (user.emailVerificationToken === emailVerificationToken) {
      let collection = Database.get('users');
      let decodedToken = this.parseEmailVerificationToken({ emailVerificationToken });
      let updatedUser = await collection.findOneAndUpdate({ _id }, Object.assign({
        email: decodedToken.email,
        emailVerified: true
      }, update));

      // Throw event
      this.emit('verifyEmail', { user, updatedUser });

      return updatedUser;
    } else {
      throw new Errors.ValidationError().push(userEmailVerificationTokenMismatchCode);
    }
  }

  /**
   * Generate an email verification token for the specified email address.
   *
   * @param {string} email
   * @returns {string}
   */
  generateEmailVerificationToken({ email }) {
    return Buffer.from(JSON.stringify({ email, token: RandomString.generate(32)})).toString('base64');
  }

  /**
   * Parse an email verification token.
   *
   * @param {string} emailVerificationToken
   * @returns {Object}
   */
  parseEmailVerificationToken({ emailVerificationToken }) {
    return JSON.parse(Buffer.from(emailVerificationToken, 'base64'));
  }

  /**
   * Verify the email using the specified email verification token.
   *
   * @param {User} user
   * @param {string} emailVerificationToken
   * @return {User}
   */
  async verifyEmail({ user, emailVerificationToken }) {
    let update = Object.assign({ updatedAt: new Date() }, user);
    let { _id } = user;

    if (user.emailVerificationToken === emailVerificationToken) {
      let collection = Database.get('users');
      let decodedToken = this.parseEmailVerificationToken({ emailVerificationToken });
      let updatedUser = await collection.findOneAndUpdate({ _id }, Object.assign({
        email: decodedToken.email,
        emailVerified: true
      }, update));

      // Throw event
      this.emit('verifyEmail', { user, updatedUser });

      return updatedUser;
    } else {
      throw new Errors.ValidationError().push(userEmailVerificationTokenMismatchCode);
    }
  }

}

export default (new UserAPI())
