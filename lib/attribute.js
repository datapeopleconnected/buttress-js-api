/**
 * Buttress API -
 *
 * @file attribute.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const Helpers = require('./helpers');
const Schema = require('./schema.js');

/**
 * @class Attribute
 */
class Attribute extends Schema {
  /**
   * Instance of Attribute
   * @param {object} ButtressOptions
   */
  constructor(ButtressOptions) {
    super('attribute', ButtressOptions, true);
  }

  /**
  * Add a new attrobite to the database
  * @param {Object} attribute
  * @return {Promise}
  */
  createAttribute(attribute) {
    return this.save({attribute: attribute});
  };

  /**
  * @param {array} attributes
  * @param {object} [options={}] options
  * @return {promise} - response
  */
  syncAppAttributes(attributes, options = {}) {
    options = Helpers.checkOptions(options, this.token);
    if (attributes) options.data = attributes;
    return this._request('post', 'sync', options);
  };

  /**
 * Retrieve all attributes linked to the auth app
 * @return {Promise}
 */
  getAllAttributes() {
    return this.getAll();
  };
}
module.exports = (ButtressOptions) => new Attribute(ButtressOptions);
