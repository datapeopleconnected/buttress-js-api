/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('./buttressjs');
const Helpers = require('./helpers');
const Schema = require('./schema.js');

const User = new Schema('user', Buttress.options, true);

/**
 * @param {string} appName
 * @param {string} appUserId
 * @param {Object} [options={}] options - request options
 * @return {promise}
 */
User.findUser = function(appName, appUserId, options = {}) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  return this._request('get', `${appName}/${appUserId}`, options);
};

/**
 * @param {Object} userId - user id
 * @param {Object} token - token details
 * @param {Object} options - request options
 * @return {Promise} - resolves to the serialized Token object
 */
User.createToken = function(userId, token, options) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (token) options.data = token;
  return this._request('post', `${userId}/token`, options);
};

module.exports = User;
