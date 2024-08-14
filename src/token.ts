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

import Helpers, { RequestOptionsIn } from './helpers';
import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class Token
 */
export default class Token extends BaseSchema {
  /**
   * Instance of Token
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
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
  getAllTokens(options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('get', '', opts);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  removeAllUserTokens(options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('delete', `user`, opts);
  };

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  updateRole(details: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (details) opts.data = details;
    return this._request('put', `roles`, opts);
  };
}
