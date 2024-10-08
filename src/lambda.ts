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

import LambdaModel from './model/Lambda';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class Lambda
 */
export default class Lambda extends BaseSchema {
  /**
   * Instance of Lambda
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('lambda', ButtressOptions, true);
  }

  /**
   * Add a new lambda to the database
   * @param {Object} lambda
   * @param {Object} auth
   * @return {Promise}
   */
  createLambda(lambda: LambdaModel, auth: any) {
    return this.save({lambda, auth});
  };

  /**
   * Add a new lambda to the database
   * @param {String} lambdaId
   * @param {Object} data
   * @param {Object} options - request options
   * @return {Promise}
   */
  editLambdaDeployment(lambdaId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${lambdaId}/deployment`, opts);
  }

  /**
   * @param {Object} lambdaId - lambda id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  setPolicyProperty(lambdaId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${lambdaId}/policy-property`, opts);
  }

  /**
     * @param {Object} lambdaId - lambda id
     * @param {array} data - request data
     * @param {Object} options - request options
     * @return {Promise}
     */
  updatePolicyProperty(lambdaId: string, data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('put', `${lambdaId}/update-policy-property`, opts);
  }

  /**
   * @param {string} lambdaId
   * @param {string} executeAfter
   * @param {array} metadata
   * @param {object} options
   * @return {Promise}
   */
  scheduleExecution(lambdaId: string, executeAfter: string, metadata: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (executeAfter) opts.data = {executeAfter, metadata};
    return this._request('post', `${lambdaId}/schedule`, opts);
  }

  /**
   * @param {Object} lambdaId - lambda id
   * @param {Object} options - request options
   * @return {Promise}
   */
  clearPolicyProperty(lambdaId: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('put', `${lambdaId}/clear-policy-property`, opts);
  }
}
