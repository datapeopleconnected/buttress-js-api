/**
 * Buttress API -
 *
 * @file policy.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers from './helpers';
import Schema from './helpers/schema';

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
  createPolicy(policy) {
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
  deletePolicyByName(data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('post', 'delete-transient-policy', options);
  }

  /**
   * Sync app policies
   * @param {Array} policies
   * @param {object} options
   * @return {Promise}
   */
  syncAppPolicy(policies, options) {
    options = Helpers.checkOptions(options, this.token);
    if (policies) options.data = policies;
    return this._request('post', 'sync', options);
  };
}