'use strict';

/**
 * Buttress API -
 *
 * @file app.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, {RequestOptionsIn} from './helpers';
import Base from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import Schema from './model/Schema';

/**
 * @class App
 */
export default class App extends Base {
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
  async updateSchema(schema: Schema, options = {}) {
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
  setPolicyPropertyList(list, appId = null, options = {}) {
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
  updatePolicyPropertyList(list, appId = null, options = {}) {
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
