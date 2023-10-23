/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers from './helpers';
import Schema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class User
 */
export default class User extends Schema {
  /**
   * Instance of User
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('user', ButtressOptions, true);
  }

  /**
   * @param {string} appName
   * @param {string} appUserId
   * @param {Object} [options={}] options - request options
   * @return {promise}
   */
  findUser(appName, appUserId, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('get', `${appName}/${appUserId}`, options);
  }

  /**
   * @param {String} parameter - user parameter
   * @param {Object} [options={}] options - request options
   * @return {promise}
   */
  getUser(parameter, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('get', `${parameter}`, options);
  }

  /**
   * @param {Object} userId - user id
   * @param {Object} token - token details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized Token object
   */
  createToken(userId, token, options) {
    options = Helpers.checkOptions(options, this.token);
    if (token) options.data = token;
    return this._request('post', `${userId}/token`, options);
  }

  /**
   * @param {String} token - user token value
   * @param {Object} [options={}] options - request options
   * @return {promise}
   */
  getUserByToken(token, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (token) options.data = {token};
    return this._request('post', `get-by-token`, options);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  setPolicyProperty(userId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${userId}/policy-property`, options);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  updatePolicyProperty(userId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${userId}/update-policy-property`, options);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  removePolicyProperty(userId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${userId}/remove-policy-property`, options);
  }

  /**
   * @param {Object} userId - user id
   * @param {Object} options - request options
   * @return {Promise}
   */
  clearPolicyProperty(userId, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('put', `${userId}/clear-policy-property`, options);
  }
}