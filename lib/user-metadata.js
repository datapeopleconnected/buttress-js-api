/**
 * Rhizome API -
 *
 * @file user-metadata.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
var _options = null;

/**
 * @param {String} rhizomeUserId - id for the user
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise<T>|Promise} - promise fulfilled with the value of the metadata
 * @private
 */
var _loadUserMetadata = (rhizomeUserId, key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}/metadata/${key}`;
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', (data, response) => {
        resolve(data);
      })
      .on('error', err => reject(err))
      .on('404', err => {
        resolve(defaultValue);
      })
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

var _saveUserMetadata = (rhizomeUserId, key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}/metadata/${key}`;
    restler.post(url, {
      query: {
        token: _options.appToken
      },
      data: {
        value: JSON.stringify(value)
      }
    })
      .on('error', err => reject(err))
      .on('success', (data, response) => {
        resolve(data);
      })
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

module.exports = {
  init: options => {
    _options = options;
  },
  load: _loadUserMetadata,
  save: _saveUserMetadata
};
