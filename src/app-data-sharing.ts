/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import Helpers, { RequestOptionsIn } from './helpers';
import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import AppDataSharingModel from './model/AppDataSharing';

/**
 * @class AppDataSharing
 */
export default class AppDataSharing extends BaseSchema {
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