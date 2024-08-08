/**
 * Buttress API -
 *
 * @file lambda.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class LambdaExecution
 */
export default class LambdaExecution extends BaseSchema {
  /**
   * Instance of LambdaExecution
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('lambda-execution', ButtressOptions, true);
  }
}