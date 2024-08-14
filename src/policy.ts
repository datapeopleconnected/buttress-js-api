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
* @class Policy
*/
export default class Policy extends BaseSchema {
  /**
  * Instance of Policy
  * @param {object} ButtressOptions
  */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('policy', ButtressOptions, true);
  }

  /**
  * Add a new policy to the database
  * @param {Object} policy
  * @return {Promise}
  */
  createPolicy(policy: any) {
    return this.save(policy);
  };

  /**
  * Retrieve all policies linked to the auth app
  * @return {Promise}
  */
  getAllPolicies() {
    return this.getAll();
  };

  /**
   * Retrieve policy by name
   * @param {String} data
   * @param {Object} options
   * @return {Promise}
   */
  deletePolicyByName(data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('post', 'delete-transient-policy', opts);
  }

  /**
   * Sync app policies
   * @param {Array} policies
   * @param {object} options
   * @return {Promise}
   */
  syncAppPolicy(policies: any[], options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (policies) opts.data = policies;
    return this._request('post', 'sync', opts);
  };
}