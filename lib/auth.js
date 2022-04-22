'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class Auth
 */
class Auth extends Schema {
  /**
   * Instance of Auth
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('auth', ButtressOptions, true);

    this.User = require('./user.js')(ButtressOptions);
  }

  /**
   * @param {Object} user - user details
   * @param {Object} auth - auth details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized User object
   */
  findOrCreateUser(user, auth, options) {
    options = Helpers.checkOptions(options, this.token);
    return this.User.findUser(user.app, user.id)
      .then((data) => {
        if (data === false) return this.User.save({user: user, auth: auth});
        else if (data.tokens.length < 1) {
          // Create token
          return this.createToken(data.id, auth)
            .then((token) => {
              data.tokens.push(token);
              return data;
            });
        }

        return data;
      });
  };

  /**
   * @param {Object} userId - user id
   * @param {Object} token - token details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized Token object
   */
  createToken(userId, token, options) {
    return this.User.createToken(userId, token, options);
  };

  /**
   * @param {Object} userId - user details
   * @param {Object} appAuth - app auth details
   * @return {Promise} - resolves to the serialized User object
   */
  addAuthToUser(userId, appAuth) {
    options = Helpers.checkOptions(options, this.token);
    if (appAuth) options.data = appAuth;
    return this._request('put', `${userId}/auth`, options)
      .then((response) => Object.assign(response.data, {
        buttressId: userId,
        buttressAuthToken: response.data.authToken,
      }));
  };
}

module.exports = (ButtressOptions) => new Auth(ButtressOptions);
