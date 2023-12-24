'use strict';

/**
 * Buttress API -
 *
 * @file buttress.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

import Sugar from 'sugar';

import Helpers from './helpers';
import Schema from './helpers/schema';

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

export interface ButtressOptions {
  buttressUrl: string,
  appToken: string,
  apiPath: string,
  schema?: any[],
  version: number,
  update?: boolean,
  allowUnauthorized?: boolean,
}

type Modules = {
  [key: string]: Schema;
};

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

  options: ButtressOptionsInternal = {
    isolated: false,
    apiPath: '',
    schema: [],
    version: 1,
    update: false,
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

    if (this.options.allowUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // This line is for testing
    this.options.url = new URL(options.buttressUrl);

    this.__generateURLs();

    this.__initCoreModules();

    if (this.options.update) await this.initSchema();

    this.options.compiledSchema = await (this.getCollection('app') as App).getSchema();
    this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(s.name));

    return true;
  }

  /**
   * Init schema for current app
   * @return {promise}
   */
  initSchema() {
    return Promise.all([
      this.setSchema(this.options.schema),
    ]);
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

    if (!this.options.schema) return;

    await (this.getCollection('app') as App).updateSchema(this.options.schema);

    this.options.compiledSchema = await (this.getCollection('app') as App).getSchema();
    this.options.compiledSchema?.forEach((s: ModelSchema) => this.getCollection(s.name));

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
    this.App = new App(this.options);
    this.Auth = new Auth(this.options);
    this.Lambda = new Lambda(this.options);
    this.Policy = new Policy(this.options);
    this.Token = new Token(this.options);
    this.User = new User(this.options);
    this.SecureStore = new SecureStore(this.options);
    this.AppDataSharing = new AppDataSharing(this.options);
  }

  /**
   * Load a module based on name
   * @param {string} mod
   * @return {void}
   */
  _addModule(mod: string) {
    const caped = Sugar.String.capitalize(mod, true, true);
    this.__modules[caped] = this._loadModule(mod);
  }

  /**
   * Load a module
   * @param {object} collection
   * @return {object}
   */
  _loadModule(collection: string) {
    return new Schema(collection, this.options);
  }

  /**
   * Find module
   * @param {string} mod
   * @return {object} module
   */
  _findModule(mod: string) {
    const caped = Sugar.String.capitalize(mod, true, true);
    return this.__modules[caped];
  }

  /**
   * Get a collection based on the name
   * @param {string} collection
   * @return {object} collection
   */
  getCollection(collection: string) {
    if (!this.__initialised) throw new Error('Unable to getCollection before Buttress is initialised');

    const mod = Sugar.String.capitalize(collection, true, true);
    if (!this.__modules[mod]) {
      this._addModule(collection);
    }

    return this._findModule(collection);
  }
}

const __global = new Buttress();
export default __global;
