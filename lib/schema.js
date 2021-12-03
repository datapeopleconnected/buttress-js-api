'use strict';

/**
 * Buttress API -
 *
 * @file schema.js
 * @description
 * @author Lighten
 *
 */

const axios = require('./axios');
const Helpers = require('./helpers');

/**
 * @class Schema
 */
class Schema {
  /**
   * Instance of Schema
   * @param {object} collection
   * @param {object} ButtressOptions
   * @param {boolean} [core=false] - core schema
   */
  constructor(collection, ButtressOptions, core = false) {
    this.collection = collection;
    this._ButtressOptions = ButtressOptions;

    this._route = (core) ? collection : null;
    this._schema = null;

    this._endpoint = (core) ? this._ButtressOptions.urls.core : this._ButtressOptions.urls.app;

    if (!core) this.getSchema();
  }

  /**
   * Schema Constants
   */
  static get Constants() {
    return {
      MAX_RETRIES: 10,
      RETRY_METHODS: ['get', 'options', 'head'],
    };
  }

  /**
   * @return {object} schema
   */
  getSchema() {
    if (this._schema) {
      return this._schema;
    }

    if (!this._ButtressOptions.compiledSchema) {
      throw new NotYetInitiated('Attempting to load schema before buttress init');
    }

    const schema = this._ButtressOptions.compiledSchema.find((s) => s.collection === this.collection);
    if (!schema) {
      throw new Helpers.Errors.SchemaNotFound(`Unable to find the schema with the name '${this.collection}'`);
    }

    this._schema = schema;

    this._route = schema.name;

    return this._schema;
  }

  /**
   * @param {string} path
   * @return {object} schemaPart
   */
  createObject(path) {
    if (path) {
      return Helpers.Schema.createFromPath(this.getSchema(), path);
    }

    return Helpers.Schema.create(this.getSchema());
  }

  /**
   * @param {string} type
   * @param {string} path
   * @param {object} options
   * @param {int} attempt
   * @return {promise}
   */
  _request(type, path, options, attempt = 0) {
    if (!this._route) {
      throw new Error(`Unable to make request to Buttress due to unknown schema ${this.collection}`);
    }

    options.method = type;

    let url = `${this._endpoint}/${this._route}`;
    if (path) {
      url = `${url}/${path}`;
    }
    options.url = url;

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
        'Content-Length': options.data.length,
      };
    }

    attempt++;

    return axios.getInstance().request(options)
      .then((response) => response.data)
      .catch((err) => {
        let error = err;

        if (err.response) {
          error = new Helpers.Errors.ResponseError(err.response);
        } else if (err.request) {
          error = new Helpers.Errors.RequestError(err);
        }

        // Handle error type and retry if necessary
        if (error instanceof Helpers.Errors.RequestError &&
          Boolean(error.code) &&
          error.code !== 'ECONNABORTED' &&
          Schema.Constants.RETRY_METHODS.includes(type)
        ) {
          if (attempt >= Schema.Constants.MAX_RETRIES) throw error;

          return Helpers.backOff(attempt)
            .then(() => this._request(type, path, options, attempt));
        }

        throw error;
      });
  }

  /**
   * @param {string} id
   * @param {object} options
   * @return {promise}
   */
  get(id, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('get', id, options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  save(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', null, options)
      .then((data) => {
        if (Array.isArray(data)) return data.slice(0, 1).shift();
        return data;
      });
  }

  /**
   * @param {string} id
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  update(id, details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('put', id, options);
  }

  /**
   * @param {*} id
   * @param {object} options
   * @return {promise}
   */
  remove(id, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('delete', id, options);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  getAll(options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    return this._request('get', null, options);
  }

  /**
   * @param {object} query
   * @param {int} limit
   * @param {int} skip
   * @param {object} sort
   * @param {object} options
   * @return {promise}
   */
  search(query, limit=0, skip=0, sort, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    options.data = {
      query,
      limit,
      skip,
      sort,
    };

    if (options.project) {
      options.data.project = options.project;
    }

    return this._request('search', null, options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  removeAll(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('delete', null, options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkGet(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/load', options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkSave(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/add', options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkUpdate(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/update', options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkRemove(details, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/delete', options);
  }

  /**
  * @param {object} query
  * @param {object} sort
  * @param {object} options
   * @return {promise}
   */
  count(query, sort, options) {
    options = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    options.data = {
      query,
      sort,
    };

    return this._request('search', 'count', options);
  }
}

module.exports = Schema;
