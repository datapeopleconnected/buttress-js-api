'use strict';

/**
 * Buttress API - Helpers
 *
 * @file helpers.js
 * @description
 * @author Lighten
 *
 */

import Sugar from 'sugar';
import uuid from 'uuid';
import ObjectId from 'bson-objectid';
import crypto from 'crypto';

import SchemaModel, { Property, Properties } from '../model/Schema';

import ButtressOptionsInternal from '../types/ButtressOptionsInternal';

// Used by buttress internally
declare var lambda: any;

export interface RequestOptions {
  method: string
  params: {
    [key: string]: any
    token: string
  };
  data: any
  body: any
  headers: any
  stream: boolean
}
export interface RequestOptionsIn {
  params?: {
    [key: string]: any
    token?: string
  };
  project?: string
  data?: any;
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
    statusMessage: string
    /**
     * @param {Object} response
     */
    constructor(response: Response) {
      super();
      this.name = 'ResponseError';
      this.code = this.statusCode = response.status;
      this.statusMessage = response.statusText;
      this.message = response.statusText;
    }
  },
  RequestError: class extends Error {
    code: number | string;
    /**
     * @param {Error} err
     */
    constructor(err: Error, code: number) {
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
    return (new ObjectId()).toHexString();
  }

  /**
   * @param {object} schema
   * @return {object}
   */
  static create(schema: SchemaModel, buttressOptions: ButtressOptionsInternal) {
    if (!schema) {
      return false;
    }

    return Schema.inflate(schema, true, buttressOptions);
  }

  /**
   * @param {object} schema
   * @param {string} path
   * @return {object} schemaPart
   */
  static createFromPath(schema: SchemaModel, path: string, buttressOptions: ButtressOptionsInternal) {
    const subSchema = Schema.getSubSchema(schema, path);
    if (!subSchema) {
      return false;
    }

    return Schema.inflate(subSchema, false, buttressOptions);
  }

  /**
   * @param {object} schema
   * @param {string} path
   * @return {object} schemaPart
   */
  static getSubSchema(schema: SchemaModel, path: string) {
    return path.split('.').reduce((out: SchemaModel | undefined, path: string) => {
      if (!out) return; // Skip all paths if we hit a false

      const property = Path.get(out.properties, path);
      if (!property) {
        return;
      }
      if (property.type && property.type === 'array' && !property.__schema) {
        return;
      }

      return {
        name: path,
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
    const __buildFlattenedSchema = (property: string, parent: Properties, path: string[], flattened: {[key: string]: Property}) => {
      path.push(property);

      const isProps = (parent[property].__type) ? false : true;

      let isRoot = true;
      if (isProps) {
        for (const childProp in parent[property]) {
          if (!parent[property].hasOwnProperty(childProp)) continue;
          if (/^__/.test(childProp)) {
            continue;
          }

          isRoot = false; 
          __buildFlattenedSchema(childProp, parent[property] as Properties, path, flattened);
        }
      }

      if (isRoot === true && isProps) {
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
      if (!schema.properties.hasOwnProperty(property)) continue;
      __buildFlattenedSchema(property, schema.properties, path, flattened);
    }

    return flattened;
  }

  /**
   * @param {object} schema
   * @param {boolean} createId
   * @param {object} buttressOptions
   * @return {object} schema
   */
  static async inflate(schema: SchemaModel, createId: boolean, buttressOptions: ButtressOptionsInternal) {
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
      if (!flattenedSchema.hasOwnProperty(property)) continue;
      const config = flattenedSchema[property];
      const propVal = {
        path: property,
        value: await Schema.getPropDefault(config, buttressOptions),
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
      res.id = await Schema.getPropDefault({
        __type: 'id',
        __default: 'new',
      }, buttressOptions);
    }

    return res;
  }

  /**
   * @param {object} config
   * @param {object} ButtressOptionsInternal
   * @return {*} defaultValue
   */
  static async getPropDefault(config: Property, buttressOptions: ButtressOptionsInternal) {
    let res;
    switch (config.__type) {
    default:
    case 'boolean':
      res = config.__default !== undefined ? config.__default : false;
      break;
    case 'string':
      res = config.__default !== undefined ? config.__default : '';
      if (config.__default === 'randomString') {
        res = '';
        const length = 36;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const mask = 0x3d;

        const bytes = (buttressOptions.isolated) ? await lambda.cryptoRandomBytes(length) : crypto.randomBytes(length);
        for (let x = 0; x < bytes.length; x++) {
          const byte = bytes[x];
          res += chars[byte & mask];
        }
      }
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
      res = config.__default === 'new' ? uuid.v4() : null;
      break;
    case 'date':
      if (config.__default === null) {
        res = null;
      } else if (config.__default) {
        res = Sugar.Date.create(config.__default);
      } else {
        res = new Date();
      }
    }
    return res;
  }
}

const _checkOptions = (options?: RequestOptionsIn, defaultToken?: string): RequestOptions => {
  options = Object.assign({}, options);

  if (!defaultToken) throw new Error('No default token provided');

  const RequestOptions: RequestOptions = {
    method: '',
    params: {
      token: defaultToken,
    },
    data: {},
    headers: {},
    body: {},
    stream: false,
  };

  if (options.params) RequestOptions.params = {...RequestOptions.params, ...options.params};
  if (options.data) RequestOptions.data = {...RequestOptions.data, ...options.data};

  return RequestOptions;
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const backOff = (attempt: number) => {
  const delay = Math.pow(2, attempt) * 200;
  return sleep(delay + (delay * 0.2 * Math.random()));
};

export default {
  Path,
  Schema,
  Errors,
  checkOptions: _checkOptions,
  sleep,
  backOff,
};
