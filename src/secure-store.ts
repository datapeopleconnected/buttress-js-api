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

import Helpers, {RequestOptionsIn} from './helpers';
import BaseSchema from './helpers/schema';

import SecureStoreModel from './model/SecureStore';

import ButtressOptionsInternal from './types/ButtressOptionsInternal';
import {Entity} from './types/Entity';

/**
 * Checks a secure store key. setValue writes `storeData.<key>` as an update path, where a `.` would reach a nested
 * property, while getValue reads the key as it is, so a key holding one couldn't be read back. Both refuse it.
 * @param {string} key
 */
const checkStoreKey = (key: string) => {
  if (typeof key !== 'string' || key === '' || key.includes('.')) {
    throw new Error(`Unable to use '${String(key)}' as a secure store key, pass a non-empty string without a '.'`);
  }
};

/**
 * @class SecureStore
 */
// Buttress answers a bulk add of secure stores with `true`, not the stores
export default class SecureStore extends BaseSchema<SecureStoreModel & Entity, true> {
  /**
   * Instance of SecureStore
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions: ButtressOptionsInternal) {
    super('secure-store', ButtressOptions, true);
  }

  /**
   * @param {SecureStoreModel} secureStore
   * @return {object} - getValue and setValue for the store
   */
  _secureStoreInterface(secureStore: SecureStoreModel) {
    return {
      getValue: (key: string) => {
        checkStoreKey(key);

        // A stored 0, '' or false is still a value, only a key the store doesn't hold is missing
        if (!Object.hasOwn(secureStore.storeData, key)) {
          throw new Error(`${key} does not exist on the secure store ${secureStore.name}`);
        }

        return secureStore.storeData[key];
      },
      setValue: async (key: string, value: any) => {
        checkStoreKey(key);

        return this.update(secureStore.id, [
          {
            path: `storeData.${key}`,
            value: value,
          },
        ]);
      },
    };
  }

  /**
   * Add a new secure store to the database
   * @param {Object} details
   * @return {Promise}
   */
  async createSecureStore(details: any) {
    const store = await this.save(details);
    return this._secureStoreInterface(store);
  }

  /**
   * Add a new secure store to the database
   * @param {String} name
   * @param {Object} [options={}] options - request options
   * @return {Promise}
   */
  async findByName(name: string, options?: RequestOptionsIn) {
    const opts = Helpers.checkOptions(options, this.token);
    const secureStore = await this._request('get', `name/${Helpers.pathSegment(name)}`, opts);
    return this._secureStoreInterface(secureStore);
  }
}
