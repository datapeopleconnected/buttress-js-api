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
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  getSchema(options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('get', 'schema', options);
  };

  /**
  * @param {array} schema
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  updateSchema(schema, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (schema) options.data = schema;
    return this._request('put', 'schema', options);
  };

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
