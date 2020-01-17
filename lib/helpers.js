"use strict";

/**
 * Buttress API - Helpers
 *
 * @file helpers.js
 * @description
 * @author Lighten
 *
 */

const Sugar = require('sugar');

class Path {
  static normalize(path) {
    if (Array.isArray(path)) {
      let parts = [];
      for (let i = 0; i < path.length; i++) {
        let args = path[i].toString().split('.');
        for (let j = 0; j < args.length; j++) {
          parts.push(args[j]);
        }
      }
      return parts.join('.');
    }

    return path;
  }

  static split(path) {
    if (Array.isArray(path)) {
      return Path.normalize(path).split('.');
    }
    return path.toString().split('.');
  }

  static get(root, path, info) {
    let prop = root;
    let parts = Path.split(path);

    for (let i = 0; i < parts.length; i++) {
      if (!prop) {
        return;
      }
      let part = parts[i];
      prop = prop[part];
    }
    if (info) {
      info.path = parts.join('.');
    }
    return prop;
  }
}

class Schema {

  static create(schema) {
    if (!schema) {
      return false;
    }

    return Schema.inflate(schema, false);
  }
  static createFromPath(schema, path) {
    const subSchema = Schema.getSubSchema(schema, path);
    if (!subSchema) {
      return false;
    }

    return Schema.inflate(subSchema, false);
  }

  static getSubSchema(schema, path) {
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
        properties: property.__schema || property
      };
    }, schema);
  }

  static getFlattened(schema) {
    const __buildFlattenedSchema = (property, parent, path, flattened) => {
      path.push(property);

      let isRoot = true;
      for (let childProp in parent[property]) {
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
    for (let property in schema.properties) {
      if (!schema.properties.hasOwnProperty(property)) continue;
      __buildFlattenedSchema(property, schema.properties, path, flattened);
    }

    return flattened;
  }

  static inflate(schema) {
    const __inflateObject = (parent, path, value) => {
      if (path.length > 1) {
        let parentKey = path.shift();
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
    for (let property in flattenedSchema) {
      if (!flattenedSchema.hasOwnProperty(property)) continue;
      const config = flattenedSchema[property];
      let propVal = {
        path: property,
        value: Schema.getPropDefault(config)
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
    return res;
  }

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
        res = config.__default !== undefined ? config.__default : null;
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
  if (!options) {
    options = {};
  }
  if (!options.query) {
    options.query = {};
  }
  if (!options.data) {
    options.data = {};
  }
  if (!options.query.token) {
    options.query.token = defaultToken;
  }

  return options;
};

module.exports = {
  Path,
  Schema,
  checkOptions: _checkOptions
};
