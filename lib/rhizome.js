'use strict';

/**
 * Rhizome API -
 *
 * @file rhizome.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');

var _options = {};

/**
 * AUTH
 */

var _findOrCreateUser = user => {
  if (!_options.appToken) {
    return Promise.reject(new Error('You must specify a valid Rhizome App Token'));
  }

  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${user.app}/${user.id}`;
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', data => {
        if (data === false) {
          url = `${_options.rhizomeUrl}/user`;
          restler.post(url, {query: {token: _options.appToken}, data: user})
            .on('success', data => {
              resolve(Object.assign(user, {rhizomeId: data.id}));
            })
            .on('error', err => {
              reject(err);
            });
        } else {
          var userId = data.id;
          url = `${_options.rhizomeUrl}/user/${userId}/${user.app}/token`;
          restler.put(url, {query: {token: _options.appToken},
            data: {token: user.token, tokenSecret: user.tokenSecret}})
            .on('success', data => {
              resolve(Object.assign(user, {rhizomeId: userId}));
            })
            .on('error', err => {
              reject(err);
            });
        }
      })
      .on('error', err => reject(err));
  });
};

/**
 * Metadata
 */

/**
 * @param {String} key - identifier for the metadata
 * @param {*} defaultValue - default to return if metadata not in datastore
 * @return {Promise<T>|Promise} - promise fulfilled with the value of the metadata
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

var _loadUser = rhizomeUserId => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}`;
    restler.get(url, {query: {token: _options.appToken}})
      .on('success', (data, response) => {
        resolve(data);
      })
      .on('error', err => reject(err))
      .on('40x', err => reject(err))
      .on('50x', err => reject(err));
  });
};

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

/**
 * @type {{
 *  init: ((p1:*)),
 *  Auth: {
 *    findOrCreateUser: ((p1?:*))
*   },
*   App: {
*     getMetadata: ((p1:*)),
*     saveMetadata: ((p1:*, p2:*))
*   },
*   User: {
*     getMetadata: ((p1:*, p2:*)),
*     saveMetadata: ((p1:*, p2:*, p3:*))
*   }
*   }}
 */
module.exports = {
  init: options => {
    _options.rhizomeUrl = options.rhizomeUrl;
    _options.appToken = options.appToken || false;
  },
  Auth: {
    findOrCreateUser: _findOrCreateUser
  },
  App: {
    loadMetadata: _loadAppMetadata,
    saveMetadata: _saveAppMetadata
  },
  User: {
    load: _loadUser,
    loadMetadata: _loadUserMetadata,
    saveMetadata: _saveUserMetadata
  }
};
