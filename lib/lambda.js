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
   * @return {Promise}
   */
  createLambda(lambda) {
    return this.save(lambda);
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
}
module.exports = (ButtressOptions) => new Lambda(ButtressOptions);
