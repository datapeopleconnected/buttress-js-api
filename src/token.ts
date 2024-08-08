'use strict';

/**
 * Buttress API -
 *
 * @file token.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, { RequestOptionsIn } from './helpers';
import BaseSchema from './helpers/schema';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class Token
 */
export default class Token extends BaseSchema {
  /**
   * Instance of Token
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('token', ButtressOptions, true);
  }

  /**
   * @readonly
   */
  get AuthLevel() {
    return {
      NONE: 0,
      USER: 1,
      ADMIN: 2,
      SUPER: 3,
    };
  }

  /**
   * @param {object} options
   * @return {Promise}
   */
  getAllTokens(options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('get', '', opts);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  removeAllUserTokens(options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    return this._request('delete', `user`, opts);
  };

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  updateRole(details: any, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    if (details) opts.data = details;
    return this._request('put', `roles`, opts);
  };
}
