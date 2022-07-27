/**
 * Buttress API -
 *
 * @file policy.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Schema = require('./schema.js');
const Helpers = require('./helpers');

/**
* @class Policy
*/
class Policy extends Schema {
  /**
  * Instance of Policy
  * @param {object} ButtressOptions
  */
  constructor(ButtressOptions) {
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
   * @param {String} policyName
   * @param {Object} options
   * @return {Promise}
   */
  deletePolicyByName(policyName, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('del', policyName, options);
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

  /**
  * Remove all policies linked to the auth app
  * @return {Promise}
  */
  removeAllPolicies() {
    return this.removeAll();
  };
}
module.exports = (ButtressOptions) => new Policy(ButtressOptions);
