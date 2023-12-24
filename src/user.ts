/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import { AuthData } from './auth';
import Helpers, { RequestOptionsIn } from './helpers';
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
  findUser(appName: string, appUserId: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('get', `${appName}/${appUserId}`, opts);
  }

  /**
   * @param {String} parameter - user parameter
   * @param {Object} [options={}] options - request options
   * @return {promise}
   */
  getUser(parameter: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('get', `${parameter}`, opts);
  }

  /**
   * @param {Object} userId - user id
   * @param {Object} token - token details
   * @param {Object} options - request options
   * @return {Promise} - resolves to the serialized Token object
   */
  createToken(userId: string, token: AuthData, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (token) opts.data = token;
    return this._request('post', `${userId}/token`, opts);
  }

  /**
   * @param {String} token - user token value
   * @param {Object} [options={}] options - request options
   * @return {promise}
   */
  getUserByToken(token: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (token) opts.data = {token};
    return this._request('post', `get-by-token`, opts);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  setPolicyProperty(userId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${userId}/policy-property`, opts);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  updatePolicyProperty(userId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${userId}/update-policy-property`, opts);
  }

  /**
   * @param {Object} userId - user id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  removePolicyProperty(userId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${userId}/remove-policy-property`, opts);
  }

  /**
   * @param {Object} userId - user id
   * @param {Object} options - request options
   * @return {Promise}
   */
  clearPolicyProperty(userId: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('put', `${userId}/clear-policy-property`, opts);
  }
}