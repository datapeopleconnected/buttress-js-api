'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, {RequestOptionsIn} from './helpers';
import Schema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import User from './user';

export interface UserData {
  app: string
  appId: string
  policyProperties?: any
}
export interface AuthData {

}

/**
 * @class Auth
 */
export default class Auth extends Schema {

  private User: User;

  /**
   * Instance of Auth
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('auth', ButtressOptions, true);

    this.User = new User(ButtressOptions);
  }

  /**
   * @param {Object} user - user details
   * @param {Object} auth - auth details
   * @return {Promise} - resolves to the serialized User object
   */
  async findOrCreateUser(userData: UserData, authData: AuthData) {
    let user = null;
    try {
      user = await this.User.findUser(userData.app, userData.appId);
    } catch (err: Error) {
      if (err.code === 404) {
        user = await this.User.save({
          auth: [userData],
          token: authData,
          policyProperties: userData.policyProperties,
        });
      } else {
        throw new Error(err);
      }
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
   * @param {String} userId - user id
   * @param {String} token - token details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized Token object
   */
  createToken(userId: string, token: AuthData, options?: RequestOptionsIn) {
    return this.User.createToken(userId, token, options);
  };

  /**
   * @param {String} userId - user details
   * @param {Object} appAuth - app auth details
   * @return {Promise} - resolves to the serialized User object
   */
  addAuthToUser(userId: string, appAuth: AuthData, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (appAuth) opts.data = appAuth;
    return this._request('put', `${userId}/auth`, opts)
      .then((response) => Object.assign(response.data, {
        buttressId: userId,
        buttressAuthToken: response.data.authToken,
      }));
  };
}
