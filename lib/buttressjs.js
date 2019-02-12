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
const restler = require('restler');
const Sugar = require('sugar');

const Schema = require(`./schema.js`);

class Buttress {
  constructor() {
    this.options = {
      buttressUrl: false,
      authToken: false
    };
    this._modules = new WeakMap();
    this._initialised = false;
  }

  init(options) {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;
    this.options.buttressUrl = options.buttressUrl || false;
    this.options.authToken = options.appToken || false;
    this.options.schema = options.schema || [];
    this.options.roles = options.roles || {};

    if (!this.options.buttressUrl) {
      throw new Error("Missing required parameter: buttressUrl");
    }
    if (!this.options.authToken) {
      throw new Error("Missing required paramter: authToken");
    }

    this._initModules(_getModules());
  }

  initSchema() {
    const updateSchema = new Promise((resolve, reject) => {
      if (!this.options.schema.length) {
        resolve();
      }

      let json = JSON.stringify(this.options.schema);
      let url = `${this.url}/app/schema`;
      restler
        .put(url, {
          query: {
            token: this.authToken
          },
          headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
          data: json
        })
        .on('success', data => resolve(data))
        .on('fail', (data, response) => reject(response))
        .on('error', err => {
          throw err;
        });
    });

    const updateRoles = new Promise((resolve, reject) => {
      if (!this.options.roles.length) {
        resolve();
      }

      let json = JSON.stringify(this.options.roles);
      let url = `${this.url}/app/roles`;
      restler
        .put(url, {
          query: {
            token: this.authToken
          },
          headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
          data: json
        })
        .on('success', data => resolve(data))
        .on('fail', (data, response) => reject(response))
        .on('error', err => {
          throw err;
        });
    });

    return Promise.all([updateSchema, updateRoles]);
  }

  get url() {
    return this.options.buttressUrl;
  }

  get authToken() {
    return this.options.authToken;
  }

  _initModules(modules) {
    modules.sort();
    for (let x = 0; x < modules.length; x++) {
      this._addModule(modules[x]);
    }
  }
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
  _loadModule(collection, path) {
    if (fs.existsSync(path)) {
      return require(path);
    }

    return new Schema(collection, this.options);
  }
  _findModule(mod) {
    const split = Sugar.String.capitalize(mod, true, true).split('-');
    if (split.length === 1) {
      return this._modules[split[0]];
    }

    return this._modules[split[0]][split[1]];
  }

  getCollection(collection) {
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
  // console.log(prop);
  Object.defineProperty(buttress, prop, {
    enumerable: false,
    configurable: false,
    get: () => {
      return buttress._modules[prop];
    }
  });
}

/**
 * @return {Array} - returns an array of Route handlers
 * @private
 */
function _getModules() {
  let filenames = fs.readdirSync(`${__dirname}`);
  let files = [];

  for (let x = 0; x < filenames.length; x++) {
    let file = filenames[x];
    if (path.extname(file) === '.js' && path.basename(file, '.js') !== 'buttress.js') {
      files.push(path.basename(file, ".js"));
    }
  }

  return files;
}

/**
 */
module.exports = new Buttress();
