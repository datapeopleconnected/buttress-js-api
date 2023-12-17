/**
 * Buttress API -
 *
 * @file policy.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, { RequestOptionsIn } from './helpers';
import Schema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
* @class Policy
*/
export default class Policy extends Schema {
  /**
  * Instance of Policy
  * @param {object} ButtressOptions
  */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('policy', ButtressOptions, true);
  }

  /**
  * Add a new policy to the database
  * @param {Object} policy
  * @return {Promise}
  */
  createPolicy(policy: any) {
    return this.save(policy);
  };

  /**
  * Retrieve all policies linked to the auth app
  * @return {Promise}
  */
  getAllPolicies() {
    return this.getAll();
  };

  /**
   * Retrieve policy by name
   * @param {String} data
   * @param {Object} options
   * @return {Promise}
   */
  deletePolicyByName(data: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (data) opts.data = data;
    return this._request('post', 'delete-transient-policy', opts);
  }

  /**
   * Sync app policies
   * @param {Array} policies
   * @param {object} options
   * @return {Promise}
   */
  syncAppPolicy(policies: any[], options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (policies) opts.data = policies;
    return this._request('post', 'sync', opts);
  };
}