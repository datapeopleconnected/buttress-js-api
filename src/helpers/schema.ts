/**
 * Buttress API - The federated real-time open data platform
 * Copyright (C) 2016-2024 Data People Connected LTD.
 * <https://www.dpc-ltd.com/>
 *
 * This file is part of Buttress.
 * Buttress is free software: you can redistribute it and/or modify it under the
 * terms of the GNU Affero General Public Licence as published by the Free Software
 * Foundation, either version 3 of the Licence, or (at your option) any later version.
 * Buttress is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public Licence for more details.
 * You should have received a copy of the GNU Affero General Public Licence along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */
import type {Readable} from 'stream';

import Sugar from 'sugar';

import Helpers, {RequestOptions, RequestOptionsIn} from './';

import ModelSchema from '../model/Schema';
import ButtressOptionsInternal from '../types/ButtressOptionsInternal';
import {BulkUpdateItem, BulkUpdateResult, Entity, UpdateOperation, UpdateResult} from '../types/Entity';
import {Query, Sort} from '../types/Query';

import fetch from 'cross-fetch';
import APIResponse from '../types/Response';

// Used by buttress internally
declare const lambda: any;

/**
 * @class BaseSchema
 * @template T - the collection's entities
 * @template BulkSaveResult - what bulkSave resolves to: the added entities, but `true` for a core collection
 */
export default class BaseSchema<T extends object = Entity, BulkSaveResult = T[]> {
  collection: string;

  core: boolean = false;

  protected _ButtressOptions: ButtressOptionsInternal;

  private __route?: string;

  private __schema?: ModelSchema;

  private __protocolRegex = /(^\w+:|^)\/\//;

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
      RETRY_METHODS: ['get', 'options', 'head', 'query'],
    };
  }

  /**
   * @return {string} url
   */
  getEndpoint() {
    const endpoint = this.core ? this._ButtressOptions.urls?.core : this._ButtressOptions.urls?.app;
    return endpoint || '';
  }

  /**
   * @readonly
   */
  get token() {
    return this._ButtressOptions.authToken;
  }

  /**
   * Throws when the module was taken before Buttress.clean(), as its options are no longer the client's
   */
  protected _assertCurrent() {
    if (this._ButtressOptions.cleaned) {
      throw new Helpers.Errors.NotYetInitiated(
        `Attempting to use the ${this.collection} module after Buttress.clean(), get it again after init()`,
      );
    }
  }

  /**
   * @return {object} schema
   */
  loadSchema() {
    this._assertCurrent();

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

    this.__route = Sugar.String.dasherize(schema.name);

    return this.__schema;
  }

  /**
   * @param {string} path
   * @return {object} schemaPart
   */
  createObject(path?: string) {
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
    this._assertCurrent();

    if (!this.__route) {
      throw new Error(`Unable to make request to Buttress due to unknown schema ${this.collection}`);
    }

    options.method = type.toUpperCase();

    let url = `${this.getEndpoint()}/${this.__route}`;

    // If no protocol has been provided then default to https
    if (!url.match(this.__protocolRegex)) {
      url = `https://${url}`;
    }

    // Callers encode each id or name in the path with Helpers.pathSegment
    if (path) {
      url = `${url}/${path}`;
    }

    if (options.params) {
      const params = Helpers.queryString(options.params);

      url = params !== '' ? `${url}?${params}` : url;
    }

    if (options.token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${options.token}`,
      };
    }

    if (this._ButtressOptions.clientSessionId && !options.headers['x-client-session-id']) {
      options.headers = {
        ...options.headers,
        'x-client-session-id': this._ButtressOptions.clientSessionId,
      };
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

    // Buttress answers a QUERY without a JSON body with 415, so send an empty query rather than nothing
    if (options.method === 'QUERY' && !options.body) {
      options.body = {};
    }

    const isObjectBody = options.body && typeof options.body !== 'string';
    if (isObjectBody) options.body = JSON.stringify(options.body);

    // Content-Length is left for fetch to work out from the bytes, the string length is wrong for non-ASCII bodies.
    // A QUERY always gets the header, even when its body was passed in already a JSON string.
    if (isObjectBody || options.method === 'QUERY') {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json',
      };
    }

    attempt++;
    if (redirect) {
      url = this.__toHttps(url);
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
        throw new Helpers.Errors.ResponseError(response, response.body);
      }

      return response.body;
    }

    try {
      const response = await fetch(url, options);
      if (options.method === 'POST') {
        const needsRedirect = this._postRedirect(response, url);
        if (needsRedirect) {
          console.log(`[WARNING] A POST redirect is occuring due to different http protocol`);
          return this._request(type, path, options, attempt, true);
        }
      }

      if (!response.ok) {
        let body;
        try {
          body = await response.json();
        } catch {
          // The error body isn't JSON, fall back to the status text
        }
        throw new Helpers.Errors.ResponseError(response, body);
      }

      if (options.stream === true) {
        return response.body;
      }

      const results = await response.json();

      if (options.combineResults === true && Array.isArray(results)) {
        for (let i = 0; i < results.length; i++) {
          const item = results[i];
          for (let j = i + 1; j < results.length; j++) {
            if (!item.id || !item.sourceId) continue;
            const nextItem = results[j];
            if (item.id === nextItem.id && item.sourceId === nextItem.sourceId) {
              // Each key is defined as a plain property. Object.assign would run the __proto__ setter for the
              // "__proto__" key JSON.parse leaves on a partner's item, letting partner data set the prototype.
              for (const key of Object.keys(nextItem)) {
                Object.defineProperty(item, key, {
                  value: nextItem[key],
                  writable: true,
                  enumerable: true,
                  configurable: true,
                });
              }
              results.splice(j, 1);
              j--;
            }
          }
        }
      }

      return results;
    } catch (err: any) {
      let error = err;

      // fetch rejects with a coded error (ECONNREFUSED, ECONNRESET...) when the request never got a response
      if (!(err instanceof Helpers.Errors.ResponseError) && err.code) {
        error = new Helpers.Errors.RequestError(err, err.code);
      }

      // Handle error type and retry if necessary
      if (
        error instanceof Helpers.Errors.RequestError &&
        Boolean(error.code) &&
        error.code !== 'ECONNABORTED' &&
        BaseSchema.Constants.RETRY_METHODS.includes(type)
      ) {
        // attempt counts the first request too, so maxRetries: N sends it N more times
        const maxRetries = this._ButtressOptions.maxRetries ?? BaseSchema.Constants.MAX_RETRIES;
        if (attempt > maxRetries) throw error;

        return Helpers.backOff(attempt).then(() => this._request(type, path, options, attempt));
      }

      throw error;
    }
  }

  /**
   * Redirects post http requests to https
   * @param {object} response
   * @param {object} url
   * @return {promise}
   */
  _postRedirect(response: APIResponse, url: string) {
    if (typeof response.url !== 'string') return false;

    const original = this.__splitURL(url);
    const redirected = this.__splitURL(response.url);

    return original.rest === redirected.rest && original.protocol !== redirected.protocol;
  }

  /**
   * @param {string} url
   * @return {string} - the url over https, without an http default port such as http://host:80 has
   */
  private __toHttps(url: string) {
    try {
      const parsed = new URL(url);
      parsed.protocol = 'https:';
      return parsed.toString();
    } catch {
      return url.replace(this.__protocolRegex, 'https://');
    }
  }

  /**
   * Splits a URL into its protocol and the rest, normalised as fetch normalises the URL it reports for a response:
   * the host lower-cased and a default port dropped, so http://Host:80/x matches https://host/x
   * @param {string} url
   * @return {object} - {protocol, rest}
   */
  private __splitURL(url: string): {protocol: string | null; rest: string} {
    try {
      const parsed = new URL(url);
      return {protocol: parsed.protocol, rest: `${parsed.host}${parsed.pathname}${parsed.search}`};
    } catch {
      // Not a URL that parses, or no URL global (a lambda's isolate may not have one), so compare it as it is
      const match = url.match(this.__protocolRegex);
      return {protocol: match !== null ? (match.pop() ?? null) : null, rest: url.replace(this.__protocolRegex, '')};
    }
  }

  /**
   * @param {string} id
   * @param {object} options
   * @return {promise}
   */
  get(id: string, options: RequestOptionsIn = {}): Promise<T> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('get', Helpers.pathSegment(id), opts);
  }

  /**
   * @param {object} details
   * @param {object} options
   * @return {promise}
   */
  save(details: Partial<T>, options: RequestOptionsIn = {}): Promise<T> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', '', opts).then((data) => {
      if (Array.isArray(data)) return data.slice(0, 1).shift();
      return data;
    });
  }

  /**
   * @param {string} id
   * @param {object|array} details - one or more {path, value} updates
   * @param {object} options - pass sourceId to update an entity held in a remote datastore
   * @return {promise}
   */
  update(
    id: string,
    details: UpdateOperation | UpdateOperation[],
    options: RequestOptionsIn = {},
  ): Promise<UpdateResult[]> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    // Buttress before 29 September 2026 only took an array of updates on its core collections (user, policy...)
    if (details) opts.data = Array.isArray(details) ? details : [details];

    const path = options.sourceId
      ? `${Helpers.pathSegment(options.sourceId)}/${Helpers.pathSegment(id)}`
      : Helpers.pathSegment(id);

    return this._request('put', path, opts);
  }

  /**
   * @param {*} id
   * @param {object} options
   * @return {promise}
   */
  remove(id: string, options: RequestOptionsIn = {}): Promise<boolean> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);
    return this._request('delete', Helpers.pathSegment(id), opts);
  }

  getAll(options: RequestOptionsIn & {stream: true}): Promise<Readable>;
  getAll(options?: RequestOptionsIn): Promise<T[]>;
  /**
   * @param {object} options - pass stream: true to get the response body as a stream
   * @return {promise}
   */
  getAll(options: RequestOptionsIn = {}): Promise<T[] | Readable> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    return this._request('get', '', opts);
  }

  search(
    query: Query<T>,
    limit: number | undefined,
    skip: number | undefined,
    sort: Sort | null | 0 | undefined,
    options: RequestOptionsIn & {stream: true},
  ): Promise<Readable>;
  search(
    query: Query<T>,
    limit?: number,
    skip?: number,
    sort?: Sort | null | 0,
    options?: RequestOptionsIn,
  ): Promise<T[]>;
  /**
   * @param {object} query - operators need the $ prefix, e.g. {kudos: {$gt: 5}}
   * @param {int} limit
   * @param {int} skip
   * @param {object} sort - e.g. {name: 1}, 0 and null mean no sort
   * @param {object} options - pass stream: true to get the response body as a stream
   * @return {promise}
   */
  search(
    query: Query<T>,
    limit = 0,
    skip = 0,
    sort: Sort | null | 0 = 0,
    options: RequestOptionsIn = {},
  ): Promise<T[] | Readable> {
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

    return this._request('query', '', opts);
  }

  /**
   * Removes every entity in the collection, use bulkRemove to remove a set of ids
   * @param {null} details - no longer supported, buttress ignores it and removes everything
   * @param {object} options
   * @return {promise}
   */
  removeAll(details: null = null, options: RequestOptionsIn = {}): Promise<boolean> {
    if (details !== null && details !== undefined) {
      throw new Error(
        `removeAll removes every ${this.collection} and doesn't accept a filter, use bulkRemove(ids) instead`,
      );
    }

    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    return this._request('delete', '', opts);
  }

  /**
   * @param {string[]} details - ids of the entities to fetch
   * @param {object} options
   * @return {promise}
   */
  bulkGet(details: string[], options: RequestOptionsIn = {}): Promise<T[]> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) {
      opts.data.query = {
        ids: details,
      };
    }

    return this._request('query', 'bulk/load', opts);
  }

  /**
   * @param {object[]} details - the entities to add
   * @param {object} options
   * @return {promise} - the added entities, or `true` for a core collection such as SecureStore
   */
  bulkSave(details: Partial<T>[], options: RequestOptionsIn = {}): Promise<BulkSaveResult> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', 'bulk/add', opts);
  }

  /**
   * @param {object[]} details - {id, sourceId?, body} per entity, where body is one or more {path, value} updates
   * @param {object} options
   * @return {promise} - an item per update, refused ones have null results and a validation reason
   */
  bulkUpdate(details: BulkUpdateItem[], options: RequestOptionsIn = {}): Promise<BulkUpdateResult[]> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    // Sent as an array of updates, as update does
    if (details)
      opts.data = details.map((item) => ({...item, body: Array.isArray(item.body) ? item.body : [item.body]}));

    return this._request('post', 'bulk/update', opts);
  }

  /**
   * @param {string[]} details - ids of the entities to remove
   * @param {object} options
   * @return {promise}
   */
  bulkRemove(details: string[], options: RequestOptionsIn = {}): Promise<boolean> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    if (details) opts.data = details;

    return this._request('post', 'bulk/delete', opts);
  }

  /**
   * @param {object} [query] - operators need the $ prefix, e.g. {kudos: {$gt: 5}}. Counts everything when left out.
   * @param {object} [sort] - Buttress doesn't use it for a count
   * @param {object} options - pass actualCount to sum a count per matching policy instead of one count of the combined query
   * @return {promise}
   */
  count(query?: Query<T>, sort?: Sort | null | 0, options: RequestOptionsIn = {}): Promise<number> {
    const opts = Helpers.checkOptions(options, this._ButtressOptions.authToken);

    // Always send a query, buttress treats a body without one as the query itself
    opts.data = {
      query: query ?? {},
      sort,
    };

    if (options.actualCount) {
      opts.data.actualCount = true;
    }

    return this._request('query', 'count', opts);
  }
}
