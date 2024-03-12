'use strict';

/**
 * Buttress API - Helpers
 *
 * @file helpers.js
 * @description
 * @author Lighten
 *
 */

const Sugar = require('sugar');
const uuid = require('uuid');
const ObjectId = require('bson-objectid');

const Errors = {
  NotYetInitiated: class extends Error {
    /**
     * @param {Any} message
     */
    constructor(message) {
      super(message);
      this.name = 'ButtressNotYetInitiated';
    }
  },
  SchemaNotFound: class extends Error {
    /**
     * @param {String} message
     */
    constructor(message) {
      super(message);
      this.name = 'SchemaNotFound';
    }
  },
  ResponseError: class extends Error {
    /**
     * @param {Object} response
     */
    constructor(response) {
      super();
      this.name = 'ResponseError';
      this.code = this.statusCode = response.status;
      this.statusMessage = response.statusText;
      this.message = (response.data && response.data.message) ? response.data.message : response.statusText;
    }
  },
  RequestError: class extends Error {
    /**
     * @param {Error} err
     */
    constructor(err) {
      super(err.message);
      this.code = err.code;
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
  static normalize(path) {
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
  static split(path) {
    if (Array.isArray(path)) {
      return Path.normalize(path).split('.');
    }
    return path.toString().split('.');
  }

  /**
   * @param {object} root
   * @param {string} path
   * @param {object} info
   * @return {*} value
   */
  static get(root, path, info) {
    let prop = root;
    const parts = Path.split(path);

    for (let i = 0; i < parts.length; i++) {
      if (!prop) {
        return;
      }
      const part = parts[i];
      prop = prop[part];
    }

    if (info) {
      info.path = parts.join('.');
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
  static create(schema) {
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
  static createFromPath(schema, path) {
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
  static getSubSchema(schema, path) {
    lambda.log(`schema: ${JSON.stringify(schema)}`);
    return path.split('.').reduce((out, path) => {
      if (!out) return false; // Skip all paths if we hit a false

      const property = Path.get(out.properties, path);
      if (!property) {
        return false;
      }
      if (property.type && property.type === 'array' && !property.__schema) {
        return false;
      }

      return {
        collection: path,
        properties: property.__schema || property,
      };
    }, schema);
  }

  /**
   * @param {object} schema
   * @return {object} flatSchema
   */
  static getFlattened(schema) {
    const __buildFlattenedSchema = (property, parent, path, flattened) => {
      path.push(property);

      let isRoot = true;
      for (const childProp in parent[property]) {
        if (!parent[property].hasOwnProperty(childProp)) continue;
        if (/^__/.test(childProp)) {
          continue;
        }

        isRoot = false;
        __buildFlattenedSchema(childProp, parent[property], path, flattened);
      }

      if (isRoot === true) {
        flattened[path.join('.')] = parent[property];
        path.pop();
        return;
      }

      path.pop();
      return;
    };

    const flattened = {};
    const path = [];
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
  static inflate(schema, createId) {
    const __inflateObject = (parent, path, value) => {
      if (path.length > 1) {
        const parentKey = path.shift();
        if (!parent[parentKey]) {
          parent[parentKey] = {};
        }
        __inflateObject(parent[parentKey], path, value);
        return;
      }

      parent[path.shift()] = value;
      return;
    };

    const flattenedSchema = Schema.getFlattened(schema);

    const res = {};
    const objects = {};
    for (const property in flattenedSchema) {
      if (!flattenedSchema.hasOwnProperty(property)) continue;
      const config = flattenedSchema[property];
      const propVal = {
        path: property,
        value: Schema.getPropDefault(config),
      };

      const path = propVal.path.split('.');
      const root = path.shift();
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
  static getPropDefault(config) {
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

const _checkOptions = (options, defaultToken) => {
  options = Object.assign({}, options);

  if (!options) {
    options = {};
  }
  if (!options.params) {
    options.params = {};
  }
  if (!options.data) {
    options.data = {};
  }
  if (!options.params.token) {
    options.params.token = defaultToken;
  }

  return options;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const backOff = (attempt) => {
  const delay = Math.pow(2, attempt) * 200;
  return sleep(delay + (delay * 0.2 * Math.random()));
};

module.exports = {
  Path,
  Schema,
  Errors,
  checkOptions: _checkOptions,
  sleep,
  backOff,
};
