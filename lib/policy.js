/**
 * Buttress API -
 *
 * @file attribute.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Schema = require('./schema.js');

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
  * Remove all policies linked to the auth app
  * @return {Promise}
  */
  removeAllPolicies() {
    return this.removeAll();
  };
}
module.exports = (ButtressOptions) => new Policy(ButtressOptions);
