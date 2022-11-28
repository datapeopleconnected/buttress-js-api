/**
 * Buttress API -
 *
 * @file lambda.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class SecureStore
 */
class SecureStore extends Schema {
  /**
   * Instance of SecureStore
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('secureStore', ButtressOptions, true);
  }

  /**
   * Add a new secure store to the database
   * @param {Object} key
   * @return {Promise}
   */
  createSecureStore(key) {
    return this.save(key);
  };

  /**
   * Add a new secure store to the database
   * @param {String} name
   * @param {Object} [options={}] options - request options
   * @return {Promise}
   */
  findSecureStoreByName(name, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    return this._request('get', name, options);
  }
}
module.exports = (ButtressOptions) => new SecureStore(ButtressOptions);
