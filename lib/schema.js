'use strict';

/**
 * Buttress API -
 *
 * @file schema.js
 * @description
 * @author Lighten
 *
 */

const parse = require('url-parse');
const Helpers = require('./helpers');
const fetch = require('cross-fetch');

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

    this.core = core;

    this._route = (core) ? collection : null;
    this._schema = null;
    this._protocolRegex = /(^\w+:|^)\/\//;

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
   * @return {string} url
   */
  getEndpoint() {
    return (this.core) ? this._ButtressOptions.urls.core : this._ButtressOptions.urls.app;
  }

  /**
   * @readonly
   */
  get token() {
    return this._ButtressOptions.authToken;
  }

  /**
   * @return {object} schema
   */
  getSchema() {
    if (this._schema) {
      return this._schema;
    }

    if (!this._ButtressOptions.compiledSchema) {
      throw new Helpers.Errors.NotYetInitiated('Attempting to load schema before buttress init');
    }

    const schema = this._ButtressOptions.compiledSchema.find((s) => s.name === this.collection);
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
   * @param {boolean} redirect
   * @return {promise}
   */
  async _request(type, path, options, attempt = 0, redirect = false) {
    if (!this._route) {
      throw new Error(`Unable to make request to Buttress due to unknown schema ${this.collection}`);
    }

    options.method = type.toUpperCase();

    const url = parse(`${this.getEndpoint()}/${this._route}`);
    if (path) {
      url.set('pathname', `${url.pathname}/${path}`);
    }

    url.set('query', options.params);

    /*
     * NOTE: Check to see if our options.data is JSON,
     * Checking type is faster than parsing the property,
     * There shouldn't be a case to pass through a string
     * to options.data unless its already JSON.
     */
    if (options.data) options.body = options.data;

    if (options.method === 'GET' || options.method === 'HEAD') {
      options.body = undefined;
    }

    if (options.body && typeof options.body !== 'string') {
      options.body = JSON.stringify(options.body);
      options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': options.body.length,
      };
    }

    attempt++;
    if (redirect) {
      url.href = url.href.replace(this._protocolRegex, 'https://');
    }

    if (this._ButtressOptions.isolated) {
      const response = await lambda.fetch({
        url,
        options,
      });

      if (options.method === 'POST') {
        const needsRedirect = this._postRedirect(response, url);
        if (needsRedirect) {
          lambda.log(`[WARNING] A POST redirect is occuring due to different http protocol`);
          return this._request(type, path, options, attempt, true);
        }
      }

      if (!response.ok) {
        response.data = response.body;
        throw new Helpers.Errors.ResponseError(response);
      }

      return response.body;
    }

    return fetch(url, options)
      .then((response) => {
        if (options.method === 'POST') {
          const needsRedirect = this._postRedirect(response, url);
          if (needsRedirect) {
            console.log(`[WARNING] A POST redirect is occuring due to different http protocol`);
            return this._request(type, path, options, attempt, true);
          }
        }

        if (!response.ok) {
          return response.json()
            .then((body) => {
              response.data = body;
              throw new Helpers.Errors.ResponseError(response);
            })
            .catch((err) => {
              throw new Helpers.Errors.ResponseError(response);
            });
        }

        if (options.stream === true) {
          return response.body;
        }

        return response.json();
      })
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
   * Redirects post http requests to https
   * @param {object} response
   * @param {object} url
   * @returns {promise}
   */
  _postRedirect(response, url) {
    let originalURL = url.href.match(this._protocolRegex);
    let redirectedURL = response.url.match(this._protocolRegex);
    const originalProtocol = originalURL.pop();
    const redirectedProtocol = redirectedURL.pop();
    originalURL = url.href.replace(this._protocolRegex, '');
    redirectedURL = response.url.replace(this._protocolRegex, '');
    return originalURL === redirectedURL && originalProtocol !== redirectedProtocol;
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

    if (details) {
      options.data.query = {
        ids: details,
      };
    }

    return this._request('search', 'bulk/load', options);
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
