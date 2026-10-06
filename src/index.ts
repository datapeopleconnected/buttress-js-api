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

import Sugar from 'sugar';

import Helpers from './helpers';
import BaseSchema from './helpers/schema';

import ModelSchema from './model/Schema';
import ButtressOptions from './types/ButtressOptions';
import ButtressOptionsInternal from './types/ButtressOptionsInternal';
import {Policy as PolicyModel} from './types/Policy';
import {Entity} from './types/Entity';

import App from './app';
import Auth from './auth';
import Lambda from './lambda';
import Policy from './policy';
import Token from './token';
import User from './user';
import SecureStore from './secure-store';
import AppDataSharing from './app-data-sharing';
import LambdaExecution from './lambda-execution';

export type {ButtressOptions, BaseSchema};
export type {BulkUpdateItem, BulkUpdateResult, Entity, UpdateOperation, UpdateResult} from './types/Entity';
export type {Policy, PolicyConfig} from './types/Policy';
export type {DateOperand, LooseQuery, Projection, Query, QueryOperators, Sort, TypedQuery} from './types/Query';

// Any collection module, whatever its entities and bulkSave result
type AnyModule = BaseSchema<Entity, unknown>;

type Modules = {
  [key: string]: AnyModule;
};

export const Errors = Helpers.Errors;

/**
 * Whether two sets of init options are the same, deeply. A property set to undefined counts as left out.
 * @param {*} a
 * @param {*} b
 * @return {boolean}
 */
const isSameOptions = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = (o: Record<string, unknown>) => Object.keys(o).filter((key) => o[key] !== undefined);
  const leftKeys = keys(left);
  return (
    leftKeys.length === keys(right).length &&
    leftKeys.every((key) => Object.hasOwn(right, key) && isSameOptions(left[key], right[key]))
  );
};

/**
 * @class Buttress
 */
export class Buttress {
  options: ButtressOptionsInternal = {
    isolated: false,
    apiPath: '',
    schema: [],
    version: 1,
    update: false,
    useLocalSchema: false,
    allowUnauthorized: false,
  };

  // private __coreModules = { App, AppDataSharing, Auth, Lambda, Policy, Token, User, SecureStore };

  private __modules: Modules = {};

  private __initialised = false;

  // The first init()'s promise, which any later init() with the same options returns until clean()
  private __initPromise?: Promise<boolean | undefined>;

  // What the first init() was called with
  private __initArgs?: {options: ButtressOptions; isolated: boolean};

  /**
   * Creates an instance of Buttress.
   */
  constructor() {}

  /**
   * @return {object} Buttress Instance
   */
  new() {
    return new Buttress();
  }

  /**
   * Configure Instance of buttress
   * @param {object} options
   * @param {boolean} isolated
   * @return {promise}
   */
  async init(options: ButtressOptions, isolated = false) {
    if (this.__initPromise) {
      // Different options would be ignored, leaving the caller talking to the first app
      if (!isSameOptions(this.__initArgs, {options: {...options}, isolated})) {
        throw new Error(
          'Buttress is already initialised with different options, call clean() before init() to change them',
        );
      }

      // A call made while the first is still loading the schema waits for it rather than returning before it's done
      return this.__initPromise;
    }
    this.__initArgs = {options: {...options}, isolated};

    // Modules can only be created once initialised, reset if the schema can't be fetched so init can be retried.
    this.__initialised = true;
    const initPromise = this.__init(options, isolated).catch((err) => {
      if (this.__initPromise === initPromise) this.clean();
      throw err;
    });
    this.__initPromise = initPromise;

    return initPromise;
  }

  /**
   * @param {object} options
   * @param {boolean} isolated
   * @return {promise}
   */
  private async __init(options: ButtressOptions, isolated: boolean) {
    this.options.isolated = isolated;

    if (options.buttressUrl) this.options.buttressUrl = options.buttressUrl;
    if (options.apiPath) this.options.apiPath = options.apiPath;
    if (options.appToken) this.options.authToken = options.appToken;
    if (options.schema) this.options.schema = options.schema;
    if (options.version) this.options.version = options.version;
    if (options.update) this.options.update = options.update;
    if (options.allowUnauthorized) this.options.allowUnauthorized = options.allowUnauthorized;
    if (options.useLocalSchema) this.options.useLocalSchema = options.useLocalSchema;
    if (options.clientSessionId) this.options.clientSessionId = options.clientSessionId;
    if (options.maxRetries !== undefined) this.options.maxRetries = options.maxRetries;

    this.options.url = options.buttressUrl;

    this.__generateURLs();

    this.__initCoreModules();

    // Control if to build the schema from a local one provided or draw one from the server.
    if (this.options.useLocalSchema) {
      this.options.compiledSchema = options.schema;
      if (Array.isArray(this.options.compiledSchema)) {
        this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(s.name));
      }
    } else {
      if (this.options.update) await this.initSchema();

      this.options.compiledSchema = await (this.getCollection('app') as App).getSchema();
      this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(s.name));

      return true;
    }
  }

  /**
   * @return {boolean} - whether init has completed
   */
  get initialised() {
    return this.__initialised;
  }

  // The core modules are read from __modules so they're the same instances getCollection returns.
  get App() {
    return this.__getCoreModule<App>('app', 'App');
  }
  get Auth() {
    return this.__getCoreModule<Auth>('auth', 'Auth');
  }
  get Lambda() {
    return this.__getCoreModule<Lambda>('lambda', 'Lambda');
  }
  get Policy() {
    return this.__getCoreModule<Policy>('policy', 'Policy');
  }
  get Token() {
    return this.__getCoreModule<Token>('token', 'Token');
  }
  get User() {
    return this.__getCoreModule<User>('user', 'User');
  }
  get SecureStore() {
    return this.__getCoreModule<SecureStore>('secureStore', 'SecureStore');
  }
  get AppDataSharing() {
    return this.__getCoreModule<AppDataSharing>('appDataSharing', 'AppDataSharing');
  }
  get LambdaExecution() {
    return this.__getCoreModule<LambdaExecution>('lambdaExecution', 'LambdaExecution');
  }

  /**
   * Removes every module that has been set up.
   */
  clean() {
    // Destory all modules which have been setup.
    Object.keys(this.__modules).forEach((key) => {
      delete this.__modules[key];
    });
    this.__modules = {};

    // A module taken before clean() still holds these options, so mark them to make it fail loudly rather than go on
    // using the old app's token and URLs. Every module from here on is built with the new options object.
    this.options.cleaned = true;

    // Reset options
    this.options = {
      isolated: false,
      apiPath: '',
      schema: [],
      version: 1,
      update: false,
      useLocalSchema: false,
      allowUnauthorized: false,
    };

    this.__initialised = false;
    this.__initPromise = undefined;
    this.__initArgs = undefined;
  }

  /**
   * Init schema for current app
   * @return {promise}
   */
  async initSchema() {
    return this.setSchema(this.options.schema);
  }

  /**
   * coreUrl getter
   * @return {string} url
   */
  get coreURL() {
    return this.options.urls?.core;
  }

  /**
   * appURL getter
   * @return {string} url
   */
  get appURL() {
    return this.options.urls?.app;
  }

  /**
   * authToken getter
   * @return {string} token
   */
  get authToken() {
    return this.options.authToken;
  }

  /**
   * Errors getter
   * @return {object} Errors
   */
  get Errors() {
    return Helpers.Errors;
  }

  /**
   * @param {string} token
   */
  setAuthToken(token: string) {
    this.options.authToken = token;
  }

  /**
   * @param {string} clientSessionId - a UUID v4, sent as x-client-session-id
   */
  setClientSessionId(clientSessionId?: string) {
    this.options.clientSessionId = clientSessionId;
  }

  /**
   * @param {string} apiPath
   */
  setAPIPath(apiPath: string) {
    this.options.apiPath = apiPath;

    this.__generateURLs();
  }

  /**
   * @param {array} schema
   * @return {promise}
   */
  async setSchema(schema: ModelSchema[]) {
    this.options.schema = schema;

    if (!this.options.schema) return false;

    await this.getCollection<App>('app').updateSchema(this.options.schema);

    this.options.compiledSchema = await this.getCollection<App>('app').getSchema();
    this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(s.name));

    return true;
  }

  /**
   * Create user transient policy
   * @param {String} userId
   * @param {String} tokenId - id of the user's token, policy properties are held per token. Not its value, which would end up in access logs
   * @param {Object} policy
   * @return {Promise}
   */
  async createUserTransientPolicy(userId: string, tokenId: string, policy: PolicyModel) {
    await this.Policy.createPolicy(policy);
    await this.User.updatePolicyProperty(userId, tokenId, {[policy.name]: true});
  }

  /**
   * Delete user transient policy
   * @param {String} userId
   * @param {String} tokenId - id of the user's token, policy properties are held per token. Not its value, which would end up in access logs
   * @param {String} policyName
   * @return {Promise}
   */
  async removeUserTransientPolicy(userId: string, tokenId: string, policyName: string) {
    await this.User.removePolicyProperty(userId, tokenId, {[policyName]: true});
    await this.Policy.deletePolicyByName({name: policyName});
  }

  /**
   *
   */
  private __generateURLs() {
    this.options.urls = {
      core: `${this.options.buttressUrl}/api/v${this.options.version}`,
      app: `${this.options.buttressUrl}/${this.options.apiPath}/api/v${this.options.version}`,
    };
  }

  /**
   * Init core modules
   */
  private __initCoreModules() {
    this.__modules['app'] = new App(this.options);
    this.__modules['auth'] = new Auth(this.options);
    this.__modules['lambda'] = new Lambda(this.options);
    this.__modules['policy'] = new Policy(this.options);
    this.__modules['token'] = new Token(this.options);
    this.__modules['user'] = new User(this.options);
    this.__modules['secureStore'] = new SecureStore(this.options);
    this.__modules['appDataSharing'] = new AppDataSharing(this.options);
    this.__modules['lambdaExecution'] = new LambdaExecution(this.options);
  }

  /**
   * Get a core module, which only exists between init() and clean()
   * @param {string} key - the module's key in __modules
   * @param {string} name - the module's property name on Buttress, for the error message
   * @return {object} module
   */
  private __getCoreModule<T extends AnyModule>(key: string, name: string): T {
    const mod = this.__modules[key];
    if (!mod) throw new Helpers.Errors.NotYetInitiated(`Attempting to use Buttress.${name} before buttress init`);

    return mod as T;
  }

  /**
   * Load a module based on name
   * @param {string} mod
   * @return {void}
   */
  _addModule(mod: string) {
    const caped = Sugar.String.camelize(mod, false);
    this.__modules[caped] = this._loadModule(mod);
  }

  /**
   * Load a module
   * @param {object} collection
   * @return {object}
   */
  _loadModule(collection: string) {
    return new BaseSchema(collection, this.options);
  }

  /**
   * Find module
   * @param {string} mod
   * @return {object} module
   */
  _findModule(mod: string) {
    const caped = Sugar.String.camelize(mod, false);
    return this.__modules[caped];
  }

  /**
   * Get a collection based on the name
   * @param {string} collection
   * @return {object} collection
   */
  getCollection<T extends AnyModule = BaseSchema>(collection: string): T {
    if (!this.__initialised) throw new Error('Unable to getCollection before Buttress is initialised');

    const mod = Sugar.String.camelize(collection, false);
    if (mod !== collection)
      throw new Error(
        `Make sure that your collection: ${collection} is following the correct naming convention ${mod}`,
      );
    if (!this.__modules[mod]) {
      this._addModule(collection);
    }

    return this._findModule(collection) as T;
  }
}

export default new Buttress();
