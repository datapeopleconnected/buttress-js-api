"use strict";

/**
 * Buttress API -
 *
 * @file schema.js
 * @description
 * @author Lighten
 *
 */

const restler = require('restler');

class Schema {
  constructor(collection, ButtressOptions) {
    this.collection = collection;
    this._ButtressOptions = ButtressOptions;
  }

  _checkOptions(options) {
    if (!options) {
      options = {};
    }
    if (!options.query) {
      options.query = {};
    }
    if (!options.data) {
      options.data = {};
    }
    if (!options.query.token) {
      options.query.token = this._ButtressOptions.authToken;
    }

    return options;
  }

  _request(type, path, options) {
    let url = `${this._ButtressOptions.buttressUrl}/${this.collection}`;
    if (path) {
      url = `${url}/${path}`;
    }

    return new Promise((resolve, reject) => {
      restler[type](url, options)
        .on('success', data => resolve(data))
        .on('fail', (err, response) => {
          if (err.message) {
            reject(new Error(err.message));
            return;
          }
          reject(new Error(`${response.statusMessage} (${response.statusCode})`));
        })
        .on('error', err => reject(err));
    });
  }

  getAll(options) {
    options = this._checkOptions();
    return this._request('get', null, options);
  }

  getOne(id, options) {
    options = this._checkOptions();
    options.data.id = id || null;

    let path = options.data.id;

    return this._request('get', path, options);
  }
}

module.exports = Schema;
