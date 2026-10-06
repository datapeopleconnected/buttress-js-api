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

import Helpers from './helpers';
import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import Schema from './model/Schema';

// Each policy property and the values an app allows for it, e.g. {role: ['admin', 'user']}
export type PolicyPropertyList = Record<string, unknown[]>;

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
  async getSchema(rawSchema = false, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (rawSchema) opts.params.rawSchema = true;
    return this._request('get', 'schema', opts);
  }

  /**
   * @param {array} schema
   * @param {object} [options={}] options
   */
  async updateSchema(schema: Schema[], options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (schema) opts.data = schema;
    const res = await this._request('put', 'schema', opts);

    this._ButtressOptions.compiledSchema = res;
  }

  /**
   * @param {object} list
   * @param {string} appId
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  async setPolicyPropertyList(list: PolicyPropertyList, appId = null, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (list) opts.data = list;

    let path = 'policy-property-list/false';
    if (appId) path = `${path}/${Helpers.pathSegment(appId)}`;
    return this._request('put', path, opts);
  }

  /**
   * @param {object} list
   * @param {string} appId
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  async updatePolicyPropertyList(list: PolicyPropertyList, appId = null, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (list) opts.data = list;

    let path = 'policy-property-list/true';
    if (appId) path = `${path}/${Helpers.pathSegment(appId)}`;
    return this._request('put', path, opts);
  }

  /**
   * @param {object} apiPath
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  async getPolicyPropertiesList(apiPath?: string, options = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    let path = `policy-property-list`;
    if (apiPath) path = `policy-property-list/${Helpers.pathSegment(apiPath)}`;
    return this._request('get', path, opts);
  }
}
