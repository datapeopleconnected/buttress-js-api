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
  addRelationship(data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('post', 'relationship', options);
  };

  /**
   * @param {number} relationshipId
   * @param {array} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  updateRelationshipPolicy(relationshipId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `relationship/${relationshipId}/policy`, options);
  };
}

module.exports = (ButtressOptions) => new App(ButtressOptions);
