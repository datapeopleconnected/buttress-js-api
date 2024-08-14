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

import Schema from './model/Schema';

/**
 * @class App
 */
export default class App extends BaseSchema {
  /**
   * Instance of App
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('app', ButtressOptions, true);
  }

  /**
   * @param {boolean} rawSchema
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getSchema(rawSchema = false, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (rawSchema) opts.params.rawSchema = true;
    return this._request('get', 'schema', opts);
  };

  /**
  * @param {array} schema
  * @param {object} [options={}] options
  */
  async updateSchema(schema: Schema[], options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (schema) opts.data = schema;
    const res = await this._request('put', 'schema', opts);

    this._ButtressOptions.compiledSchema = res;
  };

  /**
  * @param {array} list
  * @param {string} appId
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  setPolicyPropertyList(list: any[], appId = null, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (list) opts.data = list;

    let path = 'policy-property-list/false';
    if (appId) path = `${path}/${appId}`;
    return this._request('put', path, opts);
  }

  /**
  * @param {array} list
  * @param {string} appId
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  updatePolicyPropertyList(list: any[], appId = null, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (list) opts.data = list;

    let path = 'policy-property-list/true';
    if (appId) path = `${path}/${appId}`;
    return this._request('put', path, opts);
  }

  /**
   * @param {object} apiPath
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getPolicyPropertiesList(apiPath: string, options={}) {
    const opts = Helpers.checkOptions(options, this.token);
    let path = `policyPropertyList`;
    if (apiPath) path = `policy-property-list/${apiPath}`;
    return this._request('get', path, opts);
  }
}
