/**
 * Buttress API -
 *
 * @file lambda.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Helpers, { RequestOptionsIn } from './helpers';
import Schema from './helpers/schema';

import SecureStoreModel from './model/SecureStore';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class SecureStore
 */
export default class SecureStore extends Schema {
  /**
   * Instance of SecureStore
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('secure-store', ButtressOptions, true);
  }

  _secureStoreInterface(secureStore: SecureStoreModel) {
    return {
      'getValue': (key: string) => {
        const output = secureStore.storeData[key];
        if (!output) {
          throw new Error(`${key} does not exist on the secure store ${secureStore.name}`);
        }
  
        return output;
      },
      'setValue': (key: string, value: any) => {
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
  async createSecureStore(details: any) {
    const store = await this.save(details);
    return this._secureStoreInterface(store)
  };

  /**
   * Add a new secure store to the database
   * @param {String} name
   * @param {Object} [options={}] options - request options
   * @return {Promise}
   */
  async findByName(name: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    const secureStore = await this._request('get', `name/${name}`, opts);
    return this._secureStoreInterface(secureStore);
  }
}