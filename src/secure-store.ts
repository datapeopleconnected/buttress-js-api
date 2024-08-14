/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */

import Helpers, { RequestOptionsIn } from './helpers';
import BaseSchema from './helpers/schema';

import SecureStoreModel from './model/SecureStore';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';

/**
 * @class SecureStore
 */
export default class SecureStore extends BaseSchema {
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