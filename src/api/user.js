'use strict';

import Base from './base';
import Bcrypt from 'bcrypt';
import Errors from '~/errors';
import Validator from 'validator';
import EventEmitter from 'events';
import * as Mailer from '~/mailer';
import * as Database from '~/database';
import RandomString from 'randomstring';

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
export const userPasswordCannotBeResetCode = new Errors.ErrorCode('cannot_reset_user_password', { message: 'The user password could not be reset to the specified password' });

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
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');
    let result = collection.find({});

    if (limit) {
      limit = this.validatePaginationParameter({ type: 'limit', value: limit });
      result.limit(limit);
    }

    if (offset) {
      offset = this.validatePaginationParameter({ type: 'offset', value: offset });
      result.skip(offset);
    }

    return result.toArray();
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
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('users');
      let exists = await collection.find({ $or: [{ username }, { email }] }).toArray();

      if (exists.length <= 0) {
        let now = new Date();
        let record = null;

        try {
          record = await collection.insertOne({
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
        } catch (error) {
          this.debug(error);
        }

        if ((!record) || (record && !record.ops) || (record && record.ops && !record.ops[0])) {
          throw new Errors.InternalServerError();
        }

        record = record.ops[0];

        // Throw event
        this.emit('create', { record });

        return record;
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
   * @param {string} _id
   * @returns {User}
   */
  async findById({ _id }) {
    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');
    let result = await collection.findOne({ _id });

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
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');
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
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');
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
    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');

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

    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    let $set = Object.assign({ updatedAt: new Date() }, user);
    delete $set._id;

    let validationErrors = [];

    if (email) {
      if (Validator.isEmail(email)) {
        $set.email = email = Validator.normalizeEmail(email);
      } else {
        validationErrors.push('email');
      }
    }

    if (password) {
      if (Validator.isLength(password, { min: 6 })) {
        $set.password = password = await Bcrypt.hash(password, this.getConfig().get('user.passwordHashRounds', 10));
      } else {
        validationErrors.push('password');
      }
    }

    if (username) {
      if (Validator.isLength(username, {min: 1}) && Validator.isAlphanumeric(username)) {
        $set.username = username;
      } else {
        validationErrors.push('username');
      }
    }

    if (validationErrors.length <= 0) {
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('users');
      let $or = [];

      if (email) {
        $or.push({ email });
      }

      if (username) {
        $or.push({ username });
      }

      let exists = await collection.find({ $or }).toArray();

      if (exists.length <= 0) {
        let updatedUser = await collection.findOneAndUpdate({ _id }, { $set }, { returnOriginal: false });

        updatedUser = updatedUser.value;

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

    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    let $set = Object.assign({ passwordResetToken: this.generatePasswordResetToken(), updatedAt: new Date() }, user);
    delete $set._id;

    let connection = await Database.getConnection();

    let db = connection.db(this.getConfig().get('database.database', 'stride'));
    let collection = db.collection('users');

    let updatedUser = await collection.findOneAndUpdate({ _id }, { $set }, { returnOriginal: false });
        updatedUser = updatedUser.value;

    // Throw event
    this.emit('forgotPassword', { updatedUser });

    return updatedUser;
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
    let html = await this.render('emails.user.password-reset', { url, user });

    let mailOptions = {
      from: this.getConfig().get('mail.sender', 'no-reply@example.com'),
      to: user.email,
      subject: 'Password Reset',
      html
    };

    try {
      transport.sendMail(mailOptions);
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

    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    if (user.passwordResetToken === passwordResetToken) {
      let decodedToken = this.parsePasswordResetToken({ passwordResetToken });

      // check it has not expired
      if (Validator.isAfter(decodedToken.expiry, new Date())) {
        if (password && Validator.isLength(password, { min: 6 })) {
          password = await Bcrypt.hash(password, this.getConfig().get('user.passwordHashRounds', 10));
        } else {
          let meta = userPasswordCannotBeResetCode.getMeta();
              meta.fields = [
                'password'
              ];

          throw new Errors.ValidationError().push(userPasswordCannotBeResetCode.clone().setMeta(meta));
        }

        let connection = await Database.getConnection();

        let db = connection.db(this.getConfig().get('database.database', 'stride'));
        let collection = db.collection('users');

        let now = new Date();
        let $set = Object.assign({ password, updatedAt: now, sessionsValidAfter: now }, user);
        delete $set._id;

        let updatedUser = await collection.findOneAndUpdate({ _id }, { $set }, { returnOriginal: false });
            updatedUser = updatedUser.value;

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

    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    let validationErrors = [];

    if (email && Validator.isEmail(email)) {
      email = Validator.normalizeEmail(email);
    } else {
      validationErrors.push('email');
    }

    if (validationErrors.length <= 0) {
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('users');
      let exists = await collection.find({ email });

      if (exists.length <= 0) {
        let $set = Object.assign({ emailVerificationToken: this.generateEmailVerificationToken({ email }), updatedAt: new Date() }, user);
        delete $set._id;

        let updatedUser = await collection.findOneAndUpdate({ _id }, { $set }, { returnOriginal: false });
            updatedUser = updatedUser.value;

        // Throw event
        this.emit('changeEmail', { updatedUser });

        return updatedUser;
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
    let html = await this.render('emails.user.email-verification', { url, user });

    let mailOptions = {
      from: this.getConfig().get('mail.sender', 'no-reply@example.com'),
      to: user.email,
      subject: 'Email Verification',
      html
    };

    try {
      transport.sendMail(mailOptions);
    } catch (error) {
      throw new Errors.InternalServerError().push(unableToSendEmailVerificationTokenCode);
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
    let { _id } = user;

    if (typeof _id === 'string') {
      _id = Database.ObjectID(_id);
    }

    if (user.emailVerificationToken === emailVerificationToken) {
      let connection = await Database.getConnection();

      let db = connection.db(this.getConfig().get('database.database', 'stride'));
      let collection = db.collection('users');
      let decodedToken = this.parseEmailVerificationToken({ emailVerificationToken });

      let $set = Object.assign({ email: decodedToken.email, emailVerified: true, updatedAt: new Date()}, user);
      let updatedUser = await collection.findOneAndUpdate({ _id }, { $set } , { returnOriginal: false });
      updatedUser = updatedUser.value;

      // Throw event
      this.emit('verifyEmail', { user, updatedUser });

      return updatedUser;
    } else {
      throw new Errors.ValidationError().push(userEmailVerificationTokenMismatchCode);
    }
  }

}

export default (new UserAPI())
