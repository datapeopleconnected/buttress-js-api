'use strict';

/**
 * Buttress API -
 *
 * @file buttress.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const fs = require('fs');
const path = require('path');
const Sugar = require('sugar');
const URL = require('url').URL;

const Helpers = require('./helpers');
const Schema = require(`./schema.js`);
const axios = require('./axios');

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
      axios.configure({
        rejectUnauthorized: false,
      });
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

    this.options.urls = {
      core: `${this.options.buttressUrl}/api/v${this.options.version}`,
      app: `${this.options.buttressUrl}/${this.options.apiPath}/api/v${this.options.version}`,
    };

    return this._initModules(_getModules())
      .then(() => {
        if (this.options.update) return this.initSchema();

        return Promise.resolve();
      })
      .then(() => this.App.getSchema())
      .then((schema) => {
        this.options.compiledSchema = schema;

        schema.forEach((s) => this.getCollection(s.collection));

        return true;
      });
  }

  /**
   * Init schema for current app
   * @return {promise}
   */
  initSchema() {
    const updateSchema = () => {
      if (!this.options.schema) {
        return Promise.resolve();
      }

      return this.App.updateSchema(this.options.schema)
        .then(() => this.App.getSchema())
        .then((schema) => {
          this.options.compiledSchema = schema;
          return true;
        });
    };

    const updateRoles = () => {
      if (!this.options.roles) {
        return Promise.resolve();
      }

      return this.App.updateRoles(this.options.roles);
    };

    return Promise.all([updateSchema(), updateRoles()])
      .catch((err) => Helpers.handleError(err));
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
      return require(path);
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

  for (let x = 0; x < filenames.length; x++) {
    const file = filenames[x];
    if (path.extname(file) === '.js' && path.basename(file, '.js') !== 'buttressjs') {
      files.push(path.basename(file, '.js'));
    }
  }

  return files;
}

/**
 */
module.exports = new Buttress();
