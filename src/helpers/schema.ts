'use strict';

/**
 * Buttress API -
 *
 * @file schema.js
 * @description
 * @author Lighten
 *
 */

import Helpers, { RequestOptions } from './';

import ButtressSchema from '../types/ButtressSchema';
import ButtressOptionsInternal from '../types/ButtressOptionsInternal';

import parse from 'url-parse';
import fetch from 'cross-fetch';

/**
 * @class Base
 */
export default class Base {

  collection: string;
  
  core: boolean = false;

  private __ButtressOptions: ButtressOptionsInternal;

  private __route?: string;

  private __schema?: ButtressSchema;

  private static __protocolRegex = /(^\w+:|^)\/\//;

  /**
   * Instance of Schema
   * @param {object} collection
   * @param {object} ButtressOptions
   * @param {boolean} [core=false] - core schema
   */
  constructor(collection: string, ButtressOptions: ButtressOptionsInternal, core = false) {
    this.collection = collection;
    this.__ButtressOptions = ButtressOptions;

    this.core = core;
    if (core) this.__route = collection;

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
    return (this.core) ? this.__ButtressOptions.urls.core : this.__ButtressOptions.urls.app;
  }

  /**
   * @readonly
   */
  get token() {
    return this.__ButtressOptions.authToken;
  }

  /**
   * @return {object} schema
   */
  getSchema() {
    if (this.__schema) {
      return this.__schema;
    }

    if (!this.__ButtressOptions.compiledSchema) {
      throw new Helpers.Errors.NotYetInitiated('Attempting to load schema before buttress init');
    }

    const schema = this.__ButtressOptions.compiledSchema.find((s) => s.name === this.collection);
    if (!schema) {
      throw new Helpers.Errors.SchemaNotFound(`Unable to find the schema with the name '${this.collection}'`);
    }

    this.__schema = schema;

    this.__route = schema.name;

    return this.__schema;
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
  async _request(type: string, path: string, options: RequestOptions, attempt = 0, redirect = false): Promise<any> {
    if (!this.__route) {
      throw new Error(`Unable to make request to Buttress due to unknown schema ${this.collection}`);
    }

    options.method = type.toUpperCase();

    const url = parse(`${this.getEndpoint()}/${this.__route}`);
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
      url.href = url.href.replace(Schema.__protocolRegex, 'https://');
    }

    if (this.__ButtressOptions.isolated) {
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
          error = new Helpers.Errors.RequestError(err, err.code);
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
    let originalURL = url.href.match(Schema.__protocolRegex);
    let redirectedURL = response.url.match(Schema.__protocolRegex);
    const originalProtocol = originalURL.pop();
    const redirectedProtocol = redirectedURL.pop();
    originalURL = url.href.replace(Schema.__protocolRegex, '');
    redirectedURL = response.url.replace(Schema.__protocolRegex, '');
    return originalURL === redirectedURL && originalProtocol !== redirectedProtocol;
  }

  /**
   * @param {string} id
   * @param {object} options
   * @return {promise}
   */
  get(id, options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);
    return this._request('get', id, options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  save(details: any, options: {}) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

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
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('put', id, options);
  }

  /**
   * @param {*} id
   * @param {object} options
   * @return {promise}
   */
  remove(id, options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);
    return this._request('delete', id, options);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  getAll(options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

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
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);
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
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('delete', null, options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkGet(details, options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

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
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/add', options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkUpdate(details, options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

    if (details) options.data = details;

    return this._request('post', 'bulk/update', options);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkRemove(details, options) {
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

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
    options = Helpers.checkOptions(options, this.__ButtressOptions.authToken);

    options.data = {
      query,
      sort,
    };

    return this._request('search', 'count', options);
  }
}
