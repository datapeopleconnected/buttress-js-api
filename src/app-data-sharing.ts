'use strict';

/**
 * Buttress API -
 *
 * @file app-data-sharing.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers from './helpers';
import Schema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class AppDataSharing
 */
export default class AppDataSharing extends Schema {
  /**
   * Instance of AppDataSharing
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('app-data-sharing', ButtressOptions, true);
  }

  /**
   * Add a new lambda to the database
   * @param {Object} lambda
   * @param {Object} auth
   * @return {Promise}
   */
  createDataSharing(lambda, auth) {
    return this.save({lambda, auth});
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
    return this._request('put', `${dataSharingId}/policy`, options);
  };

  /**
   * @param {string} registrationToken
   * @param {string} newToken
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  activate(registrationToken, newToken, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    options.params.token = registrationToken;
    options.data = {newToken};
    return this._request('post', `activate`, options);
  };

  /**
   * @param {string} dataSharingId
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  reactivate(dataSharingId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('post', `reactivate/${dataSharingId}`, options);
  };

  /**
   * @param {string} dataSharingId
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  deactivate(dataSharingId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('post', `deactivate/${dataSharingId}`, options);
  };
}