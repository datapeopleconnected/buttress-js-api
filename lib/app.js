'use strict';

/**
 * Buttress API -
 *
 * @file app.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class App
 */
class App extends Schema {
  /**
   * Instance of App
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('app', ButtressOptions, true);
  }

  /**
   * @param {boolean} rawSchema
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getSchema(rawSchema = false, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (rawSchema) {
      options.params.rawSchema = true;
    }
    return this._request('get', 'schema', options);
  };

  /**
  * @param {array} schema
  * @param {object} [options={}] options
  */
  async updateSchema(schema, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (schema) options.data = schema;
    const res = await this._request('put', 'schema', options);
    this._ButtressOptions.compiledSchema = res;
  };

  /**
  * @param {array} list
  * @param {string} appId
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  setPolicyPropertyList(list, appId = null, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (list) options.data = list;

    let path = 'policyPropertyList/false';
    if (appId) path = `${path}/${appId}`;
    return this._request('put', path, options);
  }

  /**
  * @param {array} list
  * @param {string} appId
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  updatePolicyPropertyList(list, appId = null, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (list) options.data = list;

    let path = 'policyPropertyList/true';
    if (appId) path = `${path}/${appId}`;
    return this._request('put', path, options);
  }

  /**
  * @param {object} roles
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  updateRoles(roles, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (roles) options.data = roles;
    return this._request('put', 'roles', options);
  };

  /**
   * @param {object} apiPath
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getPolicyPropertiesList(apiPath, options={}) {
    options = Helpers.checkOptions(options, this.token);
    let path = `policyPropertyList`;
    if (apiPath) path = `policyPropertyList/${apiPath}`;
    return this._request('get', path, options);
  }
}

module.exports = (ButtressOptions) => new App(ButtressOptions);
