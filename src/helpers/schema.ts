'use strict';

/**
 * Buttress API -
 *
 * @file schema.js
 * @description
 * @author Lighten
 *
 */
import { URL } from 'url';

import Helpers, { RequestOptions, RequestOptionsIn } from './';

import ModelSchema from '../model/Schema';
import ButtressOptionsInternal from '../types/ButtressOptionsInternal';

import fetch from 'cross-fetch';
import APIResponse from '../types/Response';

// Used by buttress internally
declare var lambda: any;

/**
 * @class Base
 */
export default class Base {

  collection: string;
  
  core: boolean = false;

  protected _ButtressOptions: ButtressOptionsInternal;

  private __route?: string;

  private __schema?: ModelSchema;

  /**
   * Instance of Schema
   * @param {object} collection
   * @param {object} ButtressOptions
   * @param {boolean} [core=false] - core schema
   */
  constructor(collection: string, ButtressOptions: ButtressOptionsInternal, core = false) {
    this.collection = collection;
    this._ButtressOptions = ButtressOptions;

    this.core = core;
    if (core) this.__route = collection;

    if (!core) this.loadSchema();
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
    const endpoint = (this.core) ? this._ButtressOptions.urls?.core : this._ButtressOptions.urls?.app;
    return endpoint || '';
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
  loadSchema() {
    if (this.__schema) {
      return this.__schema;
    }

    if (!this._ButtressOptions.compiledSchema) {
      throw new Helpers.Errors.NotYetInitiated('Attempting to load schema before buttress init');
    }

    const schema = this._ButtressOptions.compiledSchema.find((s) => s.name === this.collection);
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
  createObject(path: string) {
    if (path) {
      return Helpers.Schema.createFromPath(this.loadSchema(), path);
    }

    return Helpers.Schema.create(this.loadSchema());
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

    const url = new URL(`${this.getEndpoint()}/${this.__route}`);
    if (path) {
      url.pathname = `${url.pathname}/${path}`;
    }

    if (options.params) {
      Object.keys(options.params).forEach((key) => {
        url.searchParams.append(key, options.params[key]);
      });
    }

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
      url.protocol = 'https:';
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
      .then((response: APIResponse) => {
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
          Base.Constants.RETRY_METHODS.includes(type)
        ) {
          if (attempt >= Base.Constants.MAX_RETRIES) throw error;

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
  _postRedirect(response: APIResponse, url: URL) {
    // let originalURL = url.href.match(Base.__protocolRegex);
    const redirectedURL = new URL(response.url);

    const originalProtocol = url.protocol;
    const redirectedProtocol = redirectedURL.protocol;

    const noProtoURL = url.href.replace(originalProtocol, '');
    const noProtoRedirect = response.url.replace(redirectedProtocol, '');
    return noProtoURL === noProtoRedirect && originalProtocol !== redirectedProtocol;
  }

  /**
   * @param {string} id
   * @param {object} options
   * @return {promise}
   */
  get(id: string, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('get', id, opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  save(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', '', opts)
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
  update(id: string, details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('put', id, opts);
  }

  /**
   * @param {*} id
   * @param {object} options
   * @return {promise}
   */
  remove(id: string, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('delete', id, opts);
  }

  /**
   * @param {object} options
   * @return {promise}
   */
  getAll(options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    return this._request('get', '', opts);
  }

  /**
   * @param {object} query
   * @param {int} limit
   * @param {int} skip
   * @param {object} sort
   * @param {object} options
   * @return {promise}
   */
  search(query: any, limit=0, skip=0, sort=0, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    opts.data = {
      query,
      limit,
      skip,
      sort,
    };

    if (options.project) {
      opts.data.project = options.project;
    }

    return this._request('search', '', opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  removeAll(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('delete', '', opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkGet(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) {
      opts.data.query = {
        ids: details,
      };
    }

    return this._request('search', 'bulk/load', opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkSave(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', 'bulk/add', opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkUpdate(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', 'bulk/update', opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  bulkRemove(details: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', 'bulk/delete', opts);
  }

  /**
  * @param {object} query
  * @param {object} sort
  * @param {object} options
   * @return {promise}
   */
  count(query: any, sort: any, options: RequestOptionsIn = {}) {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    opts.data = {
      query,
      sort,
    };

    return this._request('search', 'count', opts);
  }
}
