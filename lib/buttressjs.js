'use strict';

/**
 * Buttress API -
 *
 * @file buttress.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const Sugar = require('sugar');
const URL = require('url').URL;

const Helpers = require('./helpers');
const Schema = require(`./schema.js`);
// const axios = require('./axios');

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
   * @return {promise}
   */
  init(options) {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;
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

    return this._initModules(_getModules())
      .then(() => {
        if (this.options.update) return this.initSchema();

        return Promise.resolve();
      })
      .then(() => this.App.getSchema())
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

    return this.App.updateSchema(this.options.schema)
      .then(() => this.App.getSchema())
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

    return this.App.updateRoles(this.options.roles);
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
   * @param {Object} entity
   * @param {Object} user
   * @param {String} policyName
   * @return {Promise}
   */
  async createUserTransientPolicy(entity, user, policyName) {
    const policy = {
      name: policyName,
      merge: true,
      selection: {
        [policyName]: {
          '@eq': user.authId,
        }
      },
      config: [],
    };

    entity.relatedData.forEach((item) => {
      item.verbs.forEach((verb) => {
        const configIdx = policy.config.findIndex((c) => c.endpoints.includes(verb));
        if (configIdx !== -1) {
          if (!item.value) {
            policy.config[configIdx].query.push({
              'schema': [item.collection],
              'access': 'FULL_ACCESS',
            });
  
            return;
          }
          policy.config[configIdx].query.push({
            'schema': [item.collection],
            [item.key]: {
              '@in': item.value.split(','),
            },
          });
  
          return;
        }

        if (!item.value) {
          policy.config.push({
            'endpoints': verb,
            'query': [{
              'schema': [item.collection],
              'access': 'FULL_ACCESS',
            }],
          });

          return;
        }

        policy.config.push({
          'endpoints': verb,
          'query': [{
            'schema': [item.collection],
            [item.key]: {
              '@in': item.value.split(','),
            },
          }],
        });
      });
    });

    await this.Policy.createPolicy(policy);
    await this.User.updatePolicyProperty(user.authId, {[policyName]: user.authId});
  }


  /**
   * Delete user transient policy
   * @param {Object} user
   * @param {String} policyName
   * @param {Object} policyProperties
   * @return {Promise}
   */
   async removeUserTransientPolicy(user, policyName, policyProperties) {
    await this.Policy.deletePolicyByName({name: policyName});
    await this.User.setPolicyProperty(user.id, policyProperties);
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
   * @param {array} modules
   * @return {promise}
   */
  _initModules(modules) {
    return new Promise((resolve) => {
      modules.sort();
      for (let x = 0; x < modules.length; x++) {
        this._addModule(modules[x]);
      }
      resolve();
    });
  }

  /**
   * Load a module based on name
   * @param {string} mod
   * @return {void}
   */
  _addModule(mod) {
    const split = Sugar.String.capitalize(mod, true, true).split('-');
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
   * @param {string} path
   * @return {object}
   */
  _loadModule(collection, path) {
    if (fs.existsSync(path)) {
      return require(path)(this.options);
    }

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

    const mod = Sugar.String.capitalize(collection, true, true);
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
 * @return {Array} - returns an array of Route handlers
 * @private
 */
function _getModules() {
  const filenames = fs.readdirSync(`${__dirname}`);
  const files = [];

  const ignoredFiles = ['buttressjs', 'axios', 'helpers', 'schema'];

  for (let x = 0; x < filenames.length; x++) {
    const file = filenames[x];
    if (path.extname(file) === '.js' && !ignoredFiles.includes(path.basename(file, '.js'))) {
      files.push(path.basename(file, '.js'));
    }
  }

  return files;
}

/**
 */
module.exports = new Buttress();
