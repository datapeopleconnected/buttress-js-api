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
    this._tempToken = "";
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

  useToken(token) {
    this._tempToken = token;
    return this;
  }

  restoreToken() {
    this._tempToken = "";
  }

  get url() {
    return this.options.rhizomeUrl;
  }

  get authToken() {
    if (this._tempToken !== "") {
      return this._tempToken;
    }

    return this.options.authToken;
  }

  _initModules(modules) {
    modules = modules.sort((a, b) => {
      return a.split('-') > b.split('-');
    });

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

// module.exports = {
//   init: options => {
//     _options.rhizomeUrl = options.rhizomeUrl || false;
//     _options.appToken = options.appToken || false;

//     if (!_options.rhizomeUrl) {
//       throw new Error("Missing required parameter: rhizomeUrl");
//     }
//     if (!_options.appToken) {
//       throw new Error("Missing required paramter: appToken");
//     }

//     AppMetadata.init(_options);
//     UserMetadata.init(_options);
//     User.init(_options);
//     Person.init(_options);
//     PersonMetadata.init(_options);
//     // Auth.init(_options);
//     Campaign.init(_options);
//     CampaignMetadata.init(_options);
//   },
//   Constants: {
//     Token: {
//       AuthLevel: {
//         NONE: 0,
//         USER: 1,
//         ADMIN: 2,
//         SUPER: 3
//       }
//     }
//   },
//   getToken: () => _options.rhizomeUrl,
//   getUrl: () => _options.appToken,
//   Auth: require('./auth'),
//   App: {
//     loadMetadata: AppMetadata.load,
//     saveMetadata: AppMetadata.save
//   },
//   User: {
//     getAll: User.getAll,
//     removeAll: User.rmAll,
//     load: User.load,
//     remove: User.remove,
//     attachToPerson: User.attachToPerson,
//     loadMetadata: UserMetadata.load,
//     saveMetadata: UserMetadata.save,
//     removeMetadata: UserMetadata.remove
//   },
//   Person: {
//     getAll: Person.getAll,
//     removeAll: Person.removeAll,
//     load: Person.load,
//     save: Person.save,
//     remove: Person.remove,
//     loadMetadata: PersonMetadata.load,
//     saveMetadata: PersonMetadata.save,
//     removeMetadata: PersonMetadata.remove
//   },
//   Campaign: {
//     getAll: Campaign.getAll,
//     removeAll: Campaign.removeAll,
//     load: Campaign.load,
//     create: Campaign.create,
//     remove: Campaign.remove,
//     addImage: Campaign.addImage,
//     addEmailTemplate: Campaign.addEmailTemplate,
//     createPreviewEmail: Campaign.createPreviewEmail,
//     loadMetadata: CampaignMetadata.load,
//     saveMetadata: CampaignMetadata.save,
//     removeMetadata: CampaignMetadata.remove
//   }
// };
