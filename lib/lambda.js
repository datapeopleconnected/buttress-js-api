/**
 * Buttress API -
 *
 * @file lambda.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Schema = require('./schema.js');
const Helpers = require('./helpers');

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
   * @param {Object} lambda
   * @param {Object} auth
   * @return {Promise}
   */
  createLambda(lambda, auth) {
    return this.save({lambda, auth});
  };

  /**
   * Add a new lambda to the database
   * @param {String} lambdaId
   * @param {Object} data
   * @param {Object} options - request options
   * @return {Promise}
   */
  editLambdaDeployment(lambdaId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${lambdaId}/deployment`, options);
  }

  /**
   * @param {Object} lambdaId - lambda id
   * @param {array} data - request data
   * @param {Object} options - request options
   * @return {Promise}
   */
  setPolicyProperty(lambdaId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${lambdaId}/policyProperty`, options);
  }

  /**
     * @param {Object} lambdaId - lambda id
     * @param {array} data - request data
     * @param {Object} options - request options
     * @return {Promise}
     */
  updatePolicyProperty(lambdaId, data, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (data) options.data = data;
    return this._request('put', `${lambdaId}/updatePolicyProperty`, options);
  }
}
module.exports = (ButtressOptions) => new Lambda(ButtressOptions);
