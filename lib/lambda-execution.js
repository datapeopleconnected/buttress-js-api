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
 * @class LambdaExecution
 */
class LambdaExecution extends Schema {
  /**
   * Instance of LambdaExecution
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('lambda-execution', ButtressOptions, true);
  }
}
module.exports = (ButtressOptions) => new LambdaExecution(ButtressOptions);
