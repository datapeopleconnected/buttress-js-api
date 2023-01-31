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
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  setPolicyPropertyList(list, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (list) options.data = list;
    return this._request('put', 'policyPropertyList', options);
  }

  /**
  * @param {array} list
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  updatePolicyPropertyList(list, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (list) options.data = list;
    return this._request('put', 'updatePolicyPropertyList', options);
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
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  registerDataSharing(data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('post', 'dataSharing', options);
  };

  /**
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getDataSharing(data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('get', 'dataSharing', options);
  };

  /**
   * @param {number} dataSharingId
   * @param {array} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  updateDataSharingPolicy(dataSharingId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `dataSharing/${dataSharingId}/policy`, options);
  };

  /**
   * @param {number} dataSharingId
   * @param {array} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  updateDataSharingActivationToken(dataSharingId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `dataSharing/${dataSharingId}/token`, options);
  };

  /**
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  activateAppDataSharing(data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `dataSharing/activate`, options);
  };
}

module.exports = (ButtressOptions) => new App(ButtressOptions);
