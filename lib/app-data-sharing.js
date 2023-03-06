'use strict';

/**
 * Buttress API -
 *
 * @file app-data-sharing.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class AppDataSharing
 */
class AppDataSharing extends Schema {
  /**
   * Instance of AppDataSharing
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('appDataSharing', ButtressOptions, true);
  }

  /**
   * @param {object} data
   * @return {promise} - response
   */
  registerDataSharing(data) {
    return this.save(data);
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
   * @param {number} dataSharingId
   * @param {array} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  updateDataSharingActivationToken(dataSharingId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${dataSharingId}/token`, options);
  };

  /**
   * @param {string} remoteToken
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  activateAppDataSharing(remoteToken, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `activate/${remoteToken}`, options);
  };
}

module.exports = (ButtressOptions) => new AppDataSharing(ButtressOptions);
