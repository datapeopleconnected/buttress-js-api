'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('./buttressjs');
const Helpers = require('./helpers');
const Schema = require('./schema.js');

const User = require('./user.js');

const Auth = new Schema('auth', Buttress.options, true);

/**
 * @param {Object} user - user details
 * @param {Object} auth - auth details
 * @param {Object} options - request options
 * @return {Promise} - resolves to the serialized User object
 */
Auth.findOrCreateUser = function(user, auth, options) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  return User.findUser(user.app, user.id)
    .then((data) => (data === false) ? User.save({user: user, auth: auth}) : data);
};

/**
 * @param {Object} userId - user id
 * @param {Object} token - token details
 * @param {Object} options - request options
 * @return {Promise} - resolves to the serialized Token object
 */
Auth.createToken = function(userId, token, options) {
  return User.createToken(userId, token, options);
};

/**
 * @param {Object} userId - user details
 * @param {Object} appAuth - app auth details
 * @return {Promise} - resolves to the serialized User object
 */
Auth.addAuthToUser = function(userId, appAuth) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (appAuth) options.data = appAuth;
  return this._request('put', `${userId}/auth`, options)
    .then((response) => Object.assign(response.data, {
      buttressId: userId,
      buttressAuthToken: response.data.authToken,
    }));
};

module.exports = Auth;
