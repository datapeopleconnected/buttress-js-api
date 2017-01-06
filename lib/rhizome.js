'use strict';

/**
 * Rhizome API -
 *
 * @file rhizome.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const fs = require('fs');
const path = require('path');
const Sugar = require('sugar');

class Rhizome {
  constructor() {
    this.options = {
      rhizomeUrl: false,
      authToken: false
    };
    // this._tempToken = "";
    this._modules = new WeakMap();
    this._initialised = false;
  }

  init(options) {
    if (this._initialised === true) {
      return;
    }
    this._initialised = true;
    this.options.rhizomeUrl = options.rhizomeUrl || false;
    this.options.authToken = options.appToken || false;

    if (!this.options.rhizomeUrl) {
      throw new Error("Missing required parameter: rhizomeUrl");
    }
    if (!this.options.authToken) {
      throw new Error("Missing required paramter: authToken");
    }

    this._initModules(_getModules());
  }

  // useToken(token) {
  //   this._tempToken = token;
  //   return this;
  // }
  //
  // restoreToken() {
  //   this._tempToken = "";
  // }

  get url() {
    return this.options.rhizomeUrl;
  }

  get authToken() {
    // if (this._tempToken !== "") {
    //   return this._tempToken;
    // }
    //
    // return this.options.authToken;
    return this.options.authToken;
  }

  _initModules(modules) {
    modules.sort();
    for (let x = 0; x < modules.length; x++) {
      let split = Sugar.String.capitalize(modules[x], true, true).split('-');
      if (split.length === 1) {
        this._modules[split[0]] = require(`${__dirname}/${modules[x]}.js`);
        _defineModuleGetter(this, split[0]);
      } else {
        if (!this._modules[split[0]]) {
          this._modules[split[0]] = {};
          _defineModuleGetter(this, split[0]);
        }
        this._modules[split[0]][split[1]] = require(`${__dirname}/${modules[x]}.js`);
      }
    }
  }

}
/**
 * @param  {Object} rhizome - parent rhizome object
 * @param  {String} prop - name of the property to make the getter for
 */
function _defineModuleGetter(rhizome, prop) {
  // console.log(prop);
  Object.defineProperty(rhizome, prop, {
    enumerable: false,
    configurable: false,
    get: () => {
      return rhizome._modules[prop];
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
    if (path.extname(file) === '.js' && path.basename(file, '.js') !== 'rhizome.js') {
      files.push(path.basename(file, ".js"));
    }
  }

  return files;
}

/**
 */
module.exports = new Rhizome();
