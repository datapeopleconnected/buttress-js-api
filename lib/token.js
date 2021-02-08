'use strict';

/**
 * Buttress API -
 *
 * @file token.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('./buttressjs');
const Helpers = require('./helpers');
const Schema = require('./schema.js');

const Token = new Schema('token', Buttress.options, true);

Token.AuthLevel = {
  NONE: 0,
  USER: 1,
  ADMIN: 2,
  SUPER: 3,
};

/**
 * @param {object} options
 * @return {promise}
 */
Token.removeAllUserTokens = function(options) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  return this._request('delete', `user`, options);
};

/**
 * @param {object} details
 * @param {object} options
 * @return {promise}
 */
Token.updateRole = function(details, options) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (details) options.data = details;
  return this._request('put', `roles`, options);
};

module.exports = Token;
