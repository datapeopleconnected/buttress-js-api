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
import URL from 'url-parse';

import Helpers from './helpers';
import Schema from './helpers/schema';

import App from './app';
import Auth from './auth';
import Lambda from './lambda';
import Policy from './policy';
import Token from './token';
import User from './user';
import SecureStore from './secure-store';
import AppDataSharing from './app-data-sharing';
import URLParse from 'url-parse';

export interface ButtressOptions {
  buttressUrl: string,
  appToken: string,
  apiPath: string,
  schema?: any[],
  roles?: any,
  version: number,
  update?: boolean,
  allowUnauthorized?: boolean,
}
export interface ButtressOptionsInternal {
  buttressUrl?: string;
  authToken?: string;
  compiledSchema?: any;
  isolated: boolean,
  apiPath: string;
  schema: any[];
  roles: any;
  version: number;
  update: boolean;
  allowUnauthorized: boolean;
  url?: URLParse<string>;
}

type Modules = {
  [key: string]: Schema;
};

/**
 * @class Buttress
 */
class Buttress {
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
    roles: {},
    version: 1,
    update: false,
    allowUnauthorized: false
  };

  private __coreModules = { App, AppDataSharing, Auth, Lambda, Policy, Token, User, SecureStore };

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
    if (options.roles) this.options.roles = options.roles;
    if (options.version) this.options.version = options.version;
    if (options.update) this.options.update = options.update;
    if (options.allowUnauthorized) this.options.allowUnauthorized = options.allowUnauthorized;

    if (this.options.allowUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    // This line is for testing
    this.options.url = new URL(options.buttressUrl);

    this._generateURLs();

    this._initCoreModules();

    if (this.options.update) await this.initSchema();

    this.options.compiledSchema = await this.getCollection('app').getSchema();

    // Inflate schema locally
    this.options.compiledSchema.forEach((s) => this.getCollection(s.name));

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
    return this.options.urls.core;
  }

  /**
   * appURL getter
   * @return {string} url
   */
  get appURL() {
    return this.options.urls.app;
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
  setAuthToken(token) {
    this.options.authToken = token;
  }

  /**
   * @param {array} schema
   * @return {promise}
   */
  setSchema(schema) {
    this.options.schema = schema;

    if (!this.options.schema) {
      return Promise.resolve();
    }

    return this.getCollection('app').updateSchema(this.options.schema)
      .then(() => this.getCollection('app').getSchema())
      .then((schema) => {
        this.options.compiledSchema = schema;
        return true;
      });
  }

  /**
   * @param {object} roles
   * @return {promise}
   */
  setRoles(roles) {
    this.options.roles = roles;

    if (!this.options.roles) {
      return Promise.resolve();
    }

    return this.getCollection('app').updateRoles(this.options.roles);
  }

  /**
   * @param {string} apiPath
   */
  setAPIPath(apiPath) {
    this.options.apiPath = apiPath;

    this._generateURLs();
  }

  /**
   * Create user transient policy
   * @param {String} userId
   * @param {Object} policy
   * @return {Promise}
   */
  async createUserTransientPolicy(userId, policy) {
    await this.Policy.createPolicy(policy);
    await this.User.updatePolicyProperty(userId, {[policy.name]: true});
  }


  /**
   * Delete user transient policy
   * @param {String} userId
   * @param {String} policyName
   * @return {Promise}
   */
  async removeUserTransientPolicy(userId, policyName) {
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
  _generateURLs() {
    this.options.urls = {
      core: `${this.options.buttressUrl}/api/v${this.options.version}`,
      app: `${this.options.buttressUrl}/${this.options.apiPath}/api/v${this.options.version}`,
    };
  }

  /**
   * Init core modules
   * @return {promise}
   */
  _initCoreModules() {
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
  _addModule(mod) {
    const split = Sugar.String.capitalize(mod, true, true).split('-');
    if (split.length === 1) {
      this.__modules[split[0]] = this._loadModule(mod, `${__dirname}/${mod}.js`);
      _defineModuleGetter(this, split[0]);
    } else {
      if (!this.__modules[split[0]]) {
        this.__modules[split[0]] = {};
        _defineModuleGetter(this, split[0]);
      }
      this.__modules[split[0]][split[1]] = this._loadModule(mod, `${__dirname}/${mod}.js`);
    }
  }

  /**
   * Load a module
   * @param {object} collection
   * @return {object}
   */
  _loadModule(collection) {
    return new Schema(collection, this.options);
  }

  /**
   * Find module
   * @param {string} mod
   * @return {object} module
   */
  _findModule(mod) {
    const split = Sugar.String.capitalize(mod, true, true).split('-');
    if (split.length === 1) {
      return this.__modules[split[0]];
    }

    return this.__modules[split[0]][split[1]];
  }

  /**
   * Get a collection based on the name
   * @param {string} collection
   * @return {object} collection
   */
  getCollection(collection) {
    if (!this.__initialised) {
      throw new Error('Unable to getCollection before Buttress is initialised');
    }

    const mod = Sugar.String.capitalize(collection, true, true);
    if (!this.__modules[mod]) {
      this._addModule(collection);
    }

    return this._findModule(collection);
  }
}

/**
 * @param  {Object} buttress - parent buttress object
 * @param  {String} prop - name of the property to make the getter for
 */
function _defineModuleGetter(buttress, prop) {
  Object.defineProperty(buttress, prop, {
    enumerable: false,
    configurable: false,
    get: () => {
      return buttress.__modules[prop];
    },
  });
}

/**
 */
module.exports = new Buttress();
