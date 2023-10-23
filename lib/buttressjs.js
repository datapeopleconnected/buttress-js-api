'use strict';

/**
 * Buttress API -
 *
 * @file buttress.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Sugar = require('sugar');
const URL = require('url-parse');

const Helpers = require('./helpers');
const Schema = require(`./schema.js`);

const CoreModules = {
  App: require('./app.js'),
  Auth: require('./auth.js'),
  Lambda: require('./lambda.js'),
  Policy: require('./policy.js'),
  Token: require('./token.js'),
  User: require('./user.js'),
  SecureStore: require('./secure-store.js'),
  AppDataSharing: require('./app-data-sharing.js'),
};

/**
 * @class Buttress
 */
class Buttress {
  /**
   * Constructor for buttress
   */
  constructor() {
    this.options = {
      buttressUrl: false,
      authToken: false,
      compiledSchema: null,
    };

    this._modules = new WeakMap();
    this._initialised = false;
  }

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
  init(options, isolated = false) {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;
    this.options.isolated = isolated;
    this.options.buttressUrl = options.buttressUrl || false;
    this.options.apiPath = options.apiPath || '';
    this.options.authToken = options.appToken || false;
    this.options.schema = options.schema || [];
    this.options.roles = options.roles || {};
    this.options.version = options.version || 1;
    // If this flag is passed we will update the schema / role on init.
    this.options.update = options.update || false;

    this.options.allowUnauthorized = options.allowUnauthorized || false;

    if (this.options.allowUnauthorized) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    //   axios.configure({
    //     rejectUnauthorized: false,
    //   });
    }

    if (!this.options.buttressUrl) {
      throw new Error('Missing required parameter: buttressUrl');
    }
    if (!this.options.apiPath) {
      throw new Error('Missing required parameter: apiPath');
    }
    if (!this.options.version) {
      throw new Error('Missing required parameter: version');
    }
    if (!this.options.authToken) {
      throw new Error('Missing required paramter: authToken');
    }

    this.options.version = String(this.options.version);

    // This line is for testing
    this.options.url = new URL(options.buttressUrl);

    this._generateURLs();

    return this._initCoreModules()
      .then(() => {
        if (this.options.update) return this.initSchema();

        return Promise.resolve();
      })
      .then(() => this.getCollection('app').getSchema())
      .then((schema) => {
        this.options.compiledSchema = schema;

        schema.forEach((s) => this.getCollection(s.name));

        return true;
      });
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
  async _initCoreModules() {
    // const modules = CoreModules._loadModules(this.options);
    for await (const moduleKey of Object.keys(CoreModules)) {
      this._modules[moduleKey] = CoreModules[moduleKey](this.options);
      _defineModuleGetter(this, moduleKey);
    }
  }

  /**
   * Load a module based on name
   * @param {string} mod
   * @return {void}
   */
  _addModule(mod) {
    const split = Sugar.String.capitalize(mod, false, true).split('-');
    if (split.length === 1) {
      this._modules[split[0]] = this._loadModule(mod, `${__dirname}/${mod}.js`);
      _defineModuleGetter(this, split[0]);
    } else {
      if (!this._modules[split[0]]) {
        this._modules[split[0]] = {};
        _defineModuleGetter(this, split[0]);
      }
      this._modules[split[0]][split[1]] = this._loadModule(mod, `${__dirname}/${mod}.js`);
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
    const split = Sugar.String.capitalize(mod, false, true).split('-');
    if (split.length === 1) {
      return this._modules[split[0]];
    }

    return this._modules[split[0]][split[1]];
  }

  /**
   * Get a collection based on the name
   * @param {string} collection
   * @return {object} collection
   */
  getCollection(collection) {
    if (!this._initialised) {
      throw new Error('Unable to getCollection before Buttress is initialised');
    }

    const mod = Sugar.String.capitalize(collection, false, true);
    if (!this._modules[mod]) {
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
      return buttress._modules[prop];
    },
  });
}

/**
 */
module.exports = new Buttress();
