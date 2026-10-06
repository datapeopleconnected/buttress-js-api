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

import Sugar from 'sugar';
import {randomUUID} from 'node:crypto';
import ObjectId from 'bson-objectid';

import SchemaModel, {Property, Properties} from '../model/Schema';
import {Projection} from '../types/Query';

export interface RequestOptions {
  method: string;
  params: {
    [key: string]: any;
  };
  token: string;
  data: any;
  body: any;
  headers: {
    [key: string]: any;
  };
  stream: boolean;
  combineResults: boolean;
}
export interface RequestOptionsIn {
  headers?: {
    [key: string]: any;
  };
  params?: {
    [key: string]: any;
  };
  token?: string;
  project?: Projection;
  data?: any;
  stream?: boolean;
  combineResults?: boolean;
  // Used by update to target an entity held in a remote datastore
  sourceId?: string;
  // Used by count to sum a count per matching policy instead of one count of the combined query
  actualCount?: boolean;
}

const Errors = {
  NotYetInitiated: class extends Error {
    /**
     * @param {Any} message
     */
    constructor(message: string) {
      super(message);
      this.name = 'ButtressNotYetInitiated';
    }
  },
  SchemaNotFound: class extends Error {
    /**
     * @param {String} message
     */
    constructor(message: string) {
      super(message);
      this.name = 'SchemaNotFound';
    }
  },
  ResponseError: class extends Error {
    code: number;
    statusCode: number;
    statusMessage: string;
    // buttress's code for what went wrong, such as invalid_token. `code` is the HTTP status, as it always has been.
    errorCode?: string;
    // Named as Buttress reads them from an error a lambda throws, so a lambda that leaves one uncaught answers its API
    // caller with this status, rather than 400. Buttress only takes a string `code`, so errorCode isn't passed on.
    httpStatus: number;
    // Whether the same request might succeed later, as Buttress decides it for its own errors
    retryable: boolean;
    body?: any;
    /**
     * @param {Object} response
     * @param {Object} [body] - parsed error body, buttress responds with {code, message, details?}
     */
    constructor(response: {status: number; statusText?: string}, body?: any) {
      super();
      this.name = 'ResponseError';
      this.code = this.statusCode = this.httpStatus = response.status;
      this.retryable = [429, 500, 502, 503, 504].includes(response.status);
      this.statusMessage = response.statusText || '';
      this.body = body;
      if (body && typeof body.code === 'string') this.errorCode = body.code;
      this.message = body && typeof body.message === 'string' ? body.message : this.statusMessage;
    }
  },
  RequestError: class extends Error {
    code: number | string;
    /**
     * @param {Error} err
     * @param {number|string} code
     */
    constructor(err: Error, code: number | string) {
      super(err.message);
      this.code = code;
      this.name = 'RequestError';
    }
  },
};

/**
 * @class Path
 */
class Path {
  /**
   * @param {string} path
   * @return {*} normalizedPath
   */
  static normalize(path: string | string[]) {
    if (Array.isArray(path)) {
      const parts = [];
      for (let i = 0; i < path.length; i++) {
        const args = path[i].toString().split('.');
        for (let j = 0; j < args.length; j++) {
          parts.push(args[j]);
        }
      }
      return parts.join('.');
    }

    return path;
  }

  /**
   * @param {*} path
   * @return {array} splitPath
   */
  static split(path: string | string[]) {
    if (Array.isArray(path)) {
      return Path.normalize(path).split('.');
    }
    return path.toString().split('.');
  }

  /**
   * @param {object} root
   * @param {string} path
   * @return {*} value
   */
  static get(root: any, path: string) {
    let prop = root;
    const parts = Path.split(path);

    for (let i = 0; i < parts.length; i++) {
      if (!prop) {
        return;
      }
      const part = parts[i];
      prop = prop[part];
    }

    return prop;
  }
}

/**
 * @class Schema
 */
class Schema {
  /**
   * @return {string} id
   */
  static get id() {
    return new ObjectId().toHexString();
  }

  /**
   * @param {object} schema
   * @return {object}
   */
  static create(schema: SchemaModel) {
    if (!schema) {
      return false;
    }

    return Schema.inflate(schema, true);
  }

  /**
   * @param {object} schema
   * @param {string} path
   * @return {object} schemaPart
   */
  static createFromPath(schema: SchemaModel, path: string) {
    const subSchema = Schema.getSubSchema(schema, path);
    if (!subSchema) {
      return false;
    }

    return Schema.inflate(subSchema, false);
  }

  /**
   * @param {object} schema
   * @param {string} path
   * @return {object} schemaPart
   */
  static getSubSchema(schema: SchemaModel, path: string): SchemaModel | undefined {
    return path.split('.').reduce((out: SchemaModel | undefined, segment: string) => {
      if (!out) return; // Skip all paths if we hit a false

      const property = Path.get(out.properties, segment);
      if (!property) {
        return;
      }
      // A property with a __type holds a value. Only an array with a __schema has properties to build an object from,
      // anything else would be taken apart as if its settings were properties, which recurses without end.
      if (property.__type && !property.__schema) {
        throw new Error(
          `Unable to create an object for '${path}', '${segment}' is a property of type ${property.__type} with no __schema`,
        );
      }

      return {
        name: segment,
        type: 'collection',
        properties: property.__schema || property,
      };
    }, schema);
  }

  /**
   * @param {object} schema
   * @return {object} flatSchema
   */
  static getFlattened(schema: SchemaModel): {[key: string]: Property} {
    const __buildFlattenedSchema = (
      property: string,
      parent: Properties,
      path: string[],
      flattened: {[key: string]: Property},
    ) => {
      path.push(property);

      const isProps = parent[property].__type ? false : true;

      let isRoot = true;
      if (isProps) {
        for (const childProp in parent[property]) {
          if (!Object.hasOwn(parent[property], childProp)) continue;
          if (/^__/.test(childProp)) {
            continue;
          }

          isRoot = false;
          __buildFlattenedSchema(childProp, parent[property] as Properties, path, flattened);
        }
      }

      if (isRoot === true && !isProps) {
        flattened[path.join('.')] = parent[property] as Property;
        path.pop();
        return;
      }

      path.pop();
      return;
    };

    const flattened = {};
    const path: string[] = [];
    for (const property in schema.properties) {
      if (!Object.hasOwn(schema.properties, property)) continue;
      __buildFlattenedSchema(property, schema.properties, path, flattened);
    }

    return flattened;
  }

  /**
   * @param {object} schema
   * @param {boolean} createId
   * @return {object} schema
   */
  static inflate(schema: SchemaModel, createId: boolean) {
    const __inflateObject = (parent: {[key: string]: any}, path: string[], value: any) => {
      if (path.length > 1) {
        const parentKey = path.shift();
        if (!parentKey) return;

        if (!parent[parentKey]) {
          parent[parentKey] = {};
        }
        __inflateObject(parent[parentKey], path, value);
        return;
      }

      const part = path.shift();

      if (part) parent[part] = value;
      return;
    };

    const flattenedSchema = Schema.getFlattened(schema);

    const res: {[key: string]: any} = {};
    const objects: {[key: string]: any} = {};
    for (const property in flattenedSchema) {
      if (!Object.hasOwn(flattenedSchema, property)) continue;
      const config = flattenedSchema[property];
      const propVal = {
        path: property,
        value: Schema.getPropDefault(config),
      };

      const path = propVal.path.split('.');
      const root = path.shift();
      if (!root) continue;

      let value = propVal.value;
      if (path.length > 0) {
        if (!objects[root]) {
          objects[root] = {};
        }
        __inflateObject(objects[root], path, value);
        value = objects[root];
      }

      res[root] = value;
    }

    if (!res.id && createId) {
      res.id = Schema.getPropDefault({
        __type: 'id',
        __default: 'new',
      });
    }

    return res;
  }

  /**
   * @param {object} config
   * @return {*} defaultValue
   */
  static getPropDefault(config: Property) {
    let res;
    switch (config.__type) {
      default:
      case 'boolean':
        res = config.__default !== undefined ? config.__default : false;
        break;
      case 'string':
        res = config.__default !== undefined ? config.__default : '';
        break;
      case 'number':
        res = config.__default !== undefined ? config.__default : 0;
        break;
      case 'array':
        res = [];
        break;
      case 'object':
        res = {};
        break;
      case 'id':
        res = config.__default === 'new' ? Schema.id : null;
        break;
      case 'uuid':
        res = config.__default === 'new' ? randomUUID() : null;
        break;
      case 'date':
        if (config.__default === null) {
          res = null;
        } else if (config.__default) {
          // Read as Buttress reads it, so 01/02/2026 is 1 February. The locale is passed rather than set, which would
          // change it for anything else using Sugar.
          res = Sugar.Date.create(config.__default, {locale: 'en-GB'});
        } else {
          res = new Date();
        }
    }
    return res;
  }
}

const _checkOptions = (options?: RequestOptionsIn, defaultToken?: string): RequestOptions => {
  options = Object.assign({}, options);

  // A token key that's there but empty, such as a user token that failed to load, is a mistake. Falling back to the
  // instance token would act with the app's privileges on the user's behalf.
  const hasToken = Object.hasOwn(options, 'token');
  if (hasToken && !options.token) {
    throw new Error(
      `The token passed in the options is ${options.token === '' ? 'empty' : String(options.token)}, pass a token or leave the token option out to use the instance token`,
    );
  }

  // The instance token is only needed for a call that doesn't bring its own
  const token = hasToken ? options.token : defaultToken;
  if (!token) throw new Error('No default token provided');

  const requestOptions: RequestOptions = {
    method: '',
    params: {},
    token,
    data: {},
    headers: {},
    body: {},
    stream: false,
    combineResults: true,
  };

  if (options.headers) requestOptions.headers = {...requestOptions.headers, ...options.headers};
  if (options.params) requestOptions.params = {...requestOptions.params, ...options.params};
  if (options.data) requestOptions.data = {...requestOptions.data, ...options.data};
  if (options.stream) requestOptions.stream = options.stream;
  if (options.combineResults !== undefined) requestOptions.combineResults = options.combineResults;

  return requestOptions;
};

/**
 * Encodes an id or name as one segment of a request path, so whatever it holds can't change the route:
 * `/`, `?` and `#` are percent-encoded, and `.`, `..` and empty segments, which the URL would resolve
 * or drop however they're encoded, are refused.
 * @param {string|number} value - id or name passed in by the caller
 * @return {string} segment
 */
const _pathSegment = (value: string | number): string => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`Unable to use ${String(value)} as a path segment, pass a string`);
  }

  const segment = String(value);
  if (segment === '' || segment === '.' || segment === '..') {
    throw new Error(`Unable to use '${segment}' as a path segment, it would change the route`);
  }

  return encodeURIComponent(segment);
};

/**
 * Builds a request's query string from its params. A null or undefined param is left out rather than sent as the text
 * `null` or `undefined`. An array is sent as one comma-separated value, `ids=a,b`, which is how Buttress reads a list,
 * so an item holding a comma is refused, and an empty array is left out. Anything else that isn't a string, number or
 * boolean, such as an object, has no text form Buttress reads, so it's refused.
 * @param {object} params
 * @return {string} query - without the leading ?
 */
const _queryString = (params: {[key: string]: unknown}): string => {
  const encodeValue = (key: string, value: unknown, inList: boolean) => {
    if (!['string', 'number', 'boolean', 'bigint'].includes(typeof value)) {
      throw new Error(
        `Unable to send the query param '${key}', pass a string, number or boolean, or an array of them, not ${Object.prototype.toString.call(value)}`,
      );
    }

    const text = String(value);
    if (inList && text.includes(',')) {
      throw new Error(`Unable to send '${text}' in the list query param '${key}', Buttress splits a list on commas`);
    }

    return encodeURIComponent(text);
  };

  const pairs: string[] = [];
  for (const key of Object.keys(params)) {
    const value = params[key];
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      const items = value.filter((item) => item !== null && item !== undefined);
      if (items.length < 1) continue;

      pairs.push(`${encodeURIComponent(key)}=${items.map((item) => encodeValue(key, item, true)).join(',')}`);
      continue;
    }

    pairs.push(`${encodeURIComponent(key)}=${encodeValue(key, value, false)}`);
  }

  return pairs.join('&');
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const backOff = (attempt: number) => {
  const delay = Math.pow(2, attempt) * 200;
  return sleep(delay + delay * 0.2 * Math.random());
};

export default {
  Path,
  Schema,
  Errors,
  checkOptions: _checkOptions,
  pathSegment: _pathSegment,
  queryString: _queryString,
  sleep,
  backOff,
};
