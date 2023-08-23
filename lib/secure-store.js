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
    super('secure-store', ButtressOptions, true);
  }

  _secureStoreInterface(secureStore) {
    return {
      'getValue': (key) => {
        const output = secureStore.storeData[key];
        if (!output) {
          throw new Error(`${key} does not exist on the secure store ${secureStore.name}`);
        }
  
        return output;
      },
      'setValue': (key, value) => {
        return this.update(secureStore.id, [{
          path: `storeData.${key}`,
          value: value,
        }]);
      }
    };
  };

  /**
   * Add a new secure store to the database
   * @param {Object} details
   * @return {Promise}
   */
  async createSecureStore(details) {
    const store = await this.save(details);
    return this._secureStoreInterface(store)
  };

  /**
   * Add a new secure store to the database
   * @param {String} name
   * @param {Object} [options={}] options - request options
   * @return {Promise}
   */
  async findByName(name, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    const secureStore = await this._request('get', `name/${name}`, options);
    return this._secureStoreInterface(secureStore);
  }
}
module.exports = (ButtressOptions) => new SecureStore(ButtressOptions);
