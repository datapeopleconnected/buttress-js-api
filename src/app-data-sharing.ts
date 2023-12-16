'use strict';

/**
 * Buttress API -
 *
 * @file app-data-sharing.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, { RequestOptionsIn } from './helpers';
import Schema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import AppDataSharingModel from './model/AppDataSharing';

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
   * @param {AppDataSharingModel} dataShare
   * @return {Promise}
   */
  createDataSharing(dataShare: AppDataSharingModel) {
    return this.save(dataShare, {});
  };

  /**
   * @param {number} dataSharingId
   * @param {array} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  // TODO: Replace data with policy type
  updateDataSharingPolicy(dataSharingId: string, data: any[], options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${dataSharingId}/policy`, opts);
  };

  /**
   * @param {string} registrationToken
   * @param {string} newToken
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  activate(registrationToken: string, newToken: string, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    opts.params.token = registrationToken;
    opts.data = {newToken};
    return this._request('post', `activate`, opts);
  };

  /**
   * @param {string} dataSharingId
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  reactivate(dataSharingId: string, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('post', `reactivate/${dataSharingId}`, opts);
  };

  /**
   * @param {string} dataSharingId
   * @param {object} data
   * @param {object} [options={}] options
   * @return {promise} - response
   */
  deactivate(dataSharingId: string, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('post', `deactivate/${dataSharingId}`, opts);
  };
}