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
  async findOrCreateUser(userData, authData, options) {
    options = Helpers.checkOptions(options, this.token);
    let user = await this.User.findUser(userData.app, userData.id);

    if (user === false) {
      user = await this.User.save({user: userData, auth: [authData]});
    }

    if (!user.token) {
      const newToken = await this.createToken(user.id, authData);
      user.token = newToken.value;
    }

    if (!user.policyProperties && userData.policyProperties) {
      // Create policy properties for this app
      const policyPropertiesResult = await this.User.setPolicyProperty(user.id, userData.policyProperties);
      if (policyPropertiesResult) {
        user.policyProperties = userData.policyProperties;
      }
    }

    return user;
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
  addAuthToUser(userId, appAuth, options) {
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
