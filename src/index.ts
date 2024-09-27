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
import ButtressOptionsInternal from './types/ButtressOptionsInternal';

import App from './app';
import Auth from './auth';
import Lambda from './lambda';
import Policy from './policy';
import Token from './token';
import User from './user';
import SecureStore from './secure-store';
import AppDataSharing from './app-data-sharing';
import LambdaExecution from './lambda-execution';

export interface ButtressOptions {
  buttressUrl: string,
  appToken: string,
  apiPath: string,
  schema?: any[],
  version: number,
  update?: boolean,
  useLocalSchema?: boolean,
  allowUnauthorized?: boolean,
}

type Modules = {
  [key: string]: BaseSchema;
};

export const Errors = Helpers.Errors;

/**
 * @class Buttress
 */
export class Buttress {
  App?: App;
  Auth?: Auth;
  Lambda?: Lambda;
  Policy?: Policy;
  Token?: Token;
  User?: User;
  SecureStore?: SecureStore;
  AppDataSharing?: AppDataSharing;
  LambdaExecution?: LambdaExecution;

  options: ButtressOptionsInternal = {
    isolated: false,
    apiPath: '',
    schema: [],
    version: 1,
    update: false,
    useLocalSchema: false,
    allowUnauthorized: false
  };

  // private __coreModules = { App, AppDataSharing, Auth, Lambda, Policy, Token, User, SecureStore };

  private __modules: Modules = {};

  private __initialised = false;

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
    if (this.__initialised === true) return;

    this.__initialised = true;
    this.options.isolated = isolated;

    if (options.buttressUrl) this.options.buttressUrl = options.buttressUrl;
    if (options.apiPath) this.options.apiPath = options.apiPath;
    if (options.appToken) this.options.authToken = options.appToken;
    if (options.schema) this.options.schema = options.schema;
    if (options.version) this.options.version = options.version;
    if (options.update) this.options.update = options.update;
    if (options.allowUnauthorized) this.options.allowUnauthorized = options.allowUnauthorized;
    if (options.useLocalSchema) this.options.useLocalSchema = options.useLocalSchema;

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
      this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(Sugar.String.dasherize(s.name)));

      return true;
    }
  }

  get initialised() {
    return this.__initialised;
  }

  clean() {
    // Destory all modules which have been setup.
    Object.keys(this.__modules).forEach((key) => {
      delete this.__modules[key];
    });
    this.__modules = {};

    // Reset options
    this.options = {
      isolated: false,
      apiPath: '',
      schema: [],
      version: 1,
      update: false,
      useLocalSchema: false,
      allowUnauthorized: false
    };

    this.__initialised = false;
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
    this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(Sugar.String.dasherize(s.name)));

    return true;
  }

  /**
   * Create user transient policy
   * @param {String} userId
   * @param {Object} policy
   * @return {Promise}
   */
  async createUserTransientPolicy(userId: string, policy: any) {
    if (!this.Policy || !this.User) throw new Error('Unable to create transient policy before Buttress is initialised');

    await this.Policy.createPolicy(policy);
    await this.User.updatePolicyProperty(userId, {[policy.name]: true});
  }


  /**
   * Delete user transient policy
   * @param {String} userId
   * @param {String} policyName
   * @return {Promise}
   */
  async removeUserTransientPolicy(userId: string, policyName: string) {
    if (!this.Policy || !this.User) throw new Error('Unable to remove user transient policy before Buttress is initialised');

    const user = await this.User.get(userId);

    if (user.policyProperties[policyName]) {
      delete user.policyProperties[policyName];
    }

    await this.User.setPolicyProperty(userId, user.policyProperties);
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
   * @return {promise}
   */
  private __initCoreModules() {
    this.App = this.__modules['app'] = new App(this.options);
    this.Auth = this.__modules['auth'] = new Auth(this.options);
    this.Lambda = this.__modules['lambda'] = new Lambda(this.options);
    this.Policy = this.__modules['policy'] = new Policy(this.options);
    this.Token = this.__modules['token'] = new Token(this.options);
    this.User = this.__modules['user'] = new User(this.options);
    this.SecureStore = this.__modules['secure-store'] = new SecureStore(this.options);
    this.AppDataSharing = this.__modules['app-data-sharing'] = new AppDataSharing(this.options);
    this.LambdaExecution = this.__modules['lambda-execution'] = new LambdaExecution(this.options);
  }

  /**
   * Load a module based on name
   * @param {string} mod
   * @return {void}
   */
  _addModule(mod: string) {
    const caped = Sugar.String.dasherize(mod);
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
    const caped = Sugar.String.dasherize(mod);
    return this.__modules[caped];
  }

  /**
   * Get a collection based on the name
   * @param {string} collection
   * @return {object} collection
   */
  getCollection<T extends BaseSchema>(collection: string): T {
    if (!this.__initialised) throw new Error('Unable to getCollection before Buttress is initialised');

    const mod = Sugar.String.dasherize(collection);
    if (mod !== collection) throw new Error(`Make sure that your collection: ${collection} is following the correct naming convention ${mod}`);
    if (!this.__modules[mod]) {
      this._addModule(collection);
    }

    return this._findModule(collection) as T;
  }
}

export default new Buttress();
