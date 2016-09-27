'use strict';

/**
 * Rhizome API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
var _options = null;

/**
 *
 * @param {Object} user -
 * @return {Promise} - resolves to the serialized User object
 * @private
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

module.exports = {
  init: options => {
    _options = options;
  },
  findOrCreateUser: _findOrCreateUser
};
