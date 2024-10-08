/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import Helpers, {RequestOptionsIn} from './helpers';
import BaseSchema from './helpers/schema';

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
export default class Auth extends BaseSchema {

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
    } catch (err: any) {
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

    if (!user.tokens || user.tokens.length === 0) {
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
