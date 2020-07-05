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
const Helpers = require('./helpers');

class Schema {
  constructor(collection, ButtressOptions) {
    this.collection = collection;
    this._ButtressOptions = ButtressOptions;

    this._route = null;
    this._schema = null;

    this.getSchema();
  }

  getSchema() {
    if (this._schema) {
      return this._schema;
    }

    if (!this._ButtressOptions.compiledSchema) {
      throw new Error('Attempting to load schema before buttress init');
    }

    const schema = this._ButtressOptions.compiledSchema.find(s => s.collection === this.collection);
    if (!schema) {
      throw new Error(`Unable to find the schema with the name '${this.collection}'`);
    }

    this._schema = schema;

    this._route = schema.name;

    return this._schema;
  }

  createObject(path) {
    if (path) {
      return Helpers.Schema.createFromPath(this.getSchema(), path);
    }

    return Helpers.Schema.create(this.getSchema());
  }

  _request(type, path, options) {
    if (!this._route) {
      throw new Error(`Unable to make request to Buttress due to unknown schema ${this.collection}`);
    }

    let url = `${this._ButtressOptions.urls.app}/${this._route}`;
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
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('get', id, options);
  }

  save(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', null, options)
      .then((data) => {
        if (Array.isArray(data)) return data.slice(0, 1).shift();
        return data;
      })
  }

  update(id, details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('put', id, options);
  }

  remove(id, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('del', id, options);
  }

  getAll(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('get', null, options);
  }

  removeAll(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('del', null, options);
  }

  bulkGet(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/load', options);
  }

  bulkSave(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/add', options);
  }

  bulkRemove(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/delete', options);
  }
}

module.exports = Schema;
