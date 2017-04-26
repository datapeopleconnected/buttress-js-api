/**
 * Buttress API -
 *
 * @file user-metadata.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

/**
 * @param {String} buttressUserId - id for the user
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise} - promise fulfilled with the value of the metadata
 * @private
 */
var _loadUserMetadata = (buttressUserId, key, defaultValue) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}/metadata/${key}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('error', (data, response) => reject(response))
      .on('fail', (data, response) => {
        if (response.statusCode === 404) {
          resolve(defaultValue);
          return;
        }
        reject(new Error(`${response.statusCode}:${response.statusMessage}:${data.message}`));
      });
  });
};

var _saveUserMetadata = (buttressUserId, key, value) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}/metadata/${key}`;
    restler
      .post(url, {
        query: {
          token: Buttress.authToken
        },
        data: {
          value: JSON.stringify(value)
        }
      })
      .on('error', err => reject(err))
      .on('success', data => resolve(data.value))
      .on('fail', err => reject(err));
  });
};

var _rmUserMetadata = (buttressUserId, key) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}/metadata/${key}`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
        }
      })
      .on('error', err => reject(err))
      .on('success', data => resolve(data))
      .on('fail', (data, response) => {
        if (response.statusCode === 404) {
          resolve('not_found');
          return;
        }
        reject(new Error(`${response.statusCode}:${response.statusMessage}:${data.message}`));
      });
  });
};

module.exports = {
  load: _loadUserMetadata,
  save: _saveUserMetadata,
  remove: _rmUserMetadata
};
