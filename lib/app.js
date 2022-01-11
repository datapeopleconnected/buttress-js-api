'use strict';

/**
 * Buttress API -
 *
 * @file app.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Buttress = require('./buttressjs');
const Helpers = require('./helpers');
const Schema = require('./schema.js');

const App = new Schema('app', Buttress.options, true);

/**
 * @param {object} [options={}] options
 * @return {promise} - response
 */
App.getSchema = function(options = {}) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  return this._request('get', 'schema', options);
};

/**
* @param {array} schema
* @param {object} [options={}] options
 * @return {promise} - response
 */
App.updateSchema = function(schema, options = {}) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (schema) options.data = schema;
  return this._request('put', 'schema', options);
};

/**
* @param {object} roles
* @param {object} [options={}] options
 * @return {promise} - response
 */
App.updateRoles = function(roles, options = {}) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (roles) options.data = roles;
  return this._request('put', 'roles', options);
};

App.addAppRelationship = function(data, options = {}) {
  options = Helpers.checkOptions(options, Buttress.authToken);
  if (data) options.data = data;
  return this._request('post', 'relationship', options);
};

module.exports = App;
