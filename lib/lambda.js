/**
 * Buttress API -
 *
 * @file lambda.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Schema = require('./schema.js');

/**
 * @class Lambda
 */
class Lambda extends Schema {
  /**
   * Instance of Lambda
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('lambda', ButtressOptions, true);
  }

  /**
   * Add a new lambda to the database
   * @param {Object} policy
   * @return {Promise}
   */
  createLambda(policy) {
    return this.save(policy);
  };
}
module.exports = (ButtressOptions) => new Lambda(ButtressOptions);
