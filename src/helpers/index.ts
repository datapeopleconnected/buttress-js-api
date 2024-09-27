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
import { v4 as uuidv4 } from 'uuid';
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
  stream?: boolean
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
      if (!schema.properties.hasOwnProperty(property)) continue;
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
      if (!flattenedSchema.hasOwnProperty(property)) continue;
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
      res = config.__default === 'new' ? uuidv4() : null;
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

  const requestOptions: RequestOptions = {
    method: '',
    params: {
      token: defaultToken,
    },
    data: {},
    headers: {},
    body: {},
    stream: false,
  };

  if (options.params) requestOptions.params = {...requestOptions.params, ...options.params};
  if (options.data) requestOptions.data = {...requestOptions.data, ...options.data};
  if (options.stream) requestOptions.stream = options.stream;

  return requestOptions;
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
