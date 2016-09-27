'use strict';

/**
 * Rhizome API -
 *
 * @file app-metadata.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
var _options = null;

/**
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise<T>|Promise} - promise resolved with the value of the metadata
 * @private
 */
var _loadAppMetadata = (key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/app/metadata/${key}`;
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

/**
 *
 * @param {String} key - identifier for the metadata
 * @param {*} value - data to save (will be converted to JSON)
 * @return {Promise} - resolves when saved
 * @private
 */
var _saveAppMetadata = (key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/app/metadata/${key}`;
    restler.post(url, {
      query: {
        token: _options.appToken
      },
      data: {
        value: JSON.stringify(value)
      }
    }).on('success', (data, response) => {
      resolve(data);
    })
      .on('error', err => reject(err))
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

module.exports = {
  init: options => {
    _options = options;
  },
  load: _loadAppMetadata,
  save: _saveAppMetadata
};
