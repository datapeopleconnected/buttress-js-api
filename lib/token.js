'use strict';

/**
 * Buttress API -
 *
 * @file token.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class Token
 */
class Token extends Schema {
  /**
   * Instance of Token
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('token', ButtressOptions, true);
  }

  /**
   * @readonly
   */
  get AuthLevel() {
    return {
      NONE: 0,
      USER: 1,
      ADMIN: 2,
      SUPER: 3,
    };
  }

  /**
   * @param {object} options
   * @return {Promise}
   */
  getAllTokens(options) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('get', null, options);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  removeAllUserTokens(options) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('delete', `user`, options);
  };

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  updateRole(details, options) {
    options = Helpers.checkOptions(options, this.token);
    if (details) options.data = details;
    return this._request('put', `roles`, options);
  };
}

module.exports = (ButtressOptions) => new Token(ButtressOptions);
