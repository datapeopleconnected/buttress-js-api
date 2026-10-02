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

import {RequestOptionsIn} from './helpers';
import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import User from './user';

export interface UserData {
  app: string;
  appId: string;
  policyProperties?: any;
  // Whatever else the auth provider knows about the user, such as name, email and profile URLs.
  [key: string]: any;
}
export interface AuthData {
  domains?: string[];
  policyProperties?: any;
  [key: string]: any;
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
   * @param {Object} userData - user details
   * @param {Object} authData - auth details
   * @return {Promise} - resolves to the serialized User object
   */
  async findOrCreateUser(userData: UserData, authData: AuthData) {
    // Policy properties are held on the user's token, buttress only creates one when it has some.
    const tokenData =
      !authData.policyProperties && userData.policyProperties
        ? {...authData, policyProperties: userData.policyProperties}
        : authData;

    let user;
    try {
      user = await this.User.findUser(userData.app, userData.appId);
    } catch (err: any) {
      if (err.code === 404) {
        user = await this.User.save({
          auth: [userData],
          token: tokenData,
        });
      } else {
        throw err;
      }
    }

    if (!user.tokens || user.tokens.length === 0) {
      const newToken = await this.createToken(user.id, tokenData);
      user.tokens = [newToken];
      user.token = newToken.value;
    }

    const [token] = user.tokens;
    if (!token.policyProperties && userData.policyProperties) {
      await this.User.setPolicyProperty(user.id, token.id || token.value, userData.policyProperties);
      token.policyProperties = userData.policyProperties;
    }

    return user;
  }

  /**
   * @param {String} userId - user id
   * @param {String} token - token details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized Token object
   */
  createToken(userId: string, token: AuthData, options?: RequestOptionsIn) {
    return this.User.createToken(userId, token, options);
  }
}
