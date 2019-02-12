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

    /*
     * NOTE: Check to see if our options.data is JSON,
     * Checking type is faster than parsing the property,
     * There shouldn't be a case to pass through a string
     * to options.data unless its already JSON.
     */
    if (typeof options.data !== 'string') {
      options.data = JSON.stringify(options.data);
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': options.data.length
      };
    }

    return new Promise((resolve, reject) => {
      restler[type](url, options)
        .on('success', data => resolve(data))
        .on('fail', (data, response) => {
          reject({
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            message: data.message
          });
        })
        .on('error', err => reject(err));
    });
  }

  get(id, options) {
    options = this._checkOptions(options);
    return this._request('get', id, options);
  }

  save(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('post', null, options);
  }

  update(id, details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('put', id, options);
  }

  remove(id, options) {
    options = this._checkOptions(options);
    return this._request('del', id, options);
  }

  getAll(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('get', null, options);
  }

  removeAll(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('del', null, options);
  }

  bulkGet(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('post', 'bulk/load', options);
  }

  bulkSave(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('post', 'bulk/add', options);
  }

  bulkRemove(details, options) {
    options = this._checkOptions(options);

    if (details) options.data = details;

    return this._request('post', 'bulk/delete', options);
  }
}

module.exports = Schema;
