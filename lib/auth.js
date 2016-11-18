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
const Rhizome = require('./rhizome');

/**
 * @param {Object} user - user details
 * @param {Object} auth - OPTIONAL authentication details if a user access token is required
 * @return {Promise} - resolves to the serialized User object
 * @private
 */
var _findOrCreateUser = (user, auth) => {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/user/${user.app}/${user.id}`;
    restler.get(url, {query: {token: Rhizome.authToken}})
      .on('success', data => {
        if (data === false) {
          url = `${Rhizome.url}/user`;
          restler.post(url, {query: {token: Rhizome.authToken}, data: {user: user, auth: auth}})
            .on('success', user => {
              resolve(Object.assign(user, {rhizomeId: user.id, rhizomeAuthToken: user.authToken}));
            })
            .on('error', err => {
              reject(err);
            });
        } else {
          var userId = data.id;
          var userAuthToken = data.authToken;
          url = `${Rhizome.url}/user/${userId}`;
          restler.get(url, {query: {token: Rhizome.authToken}})
          .on('success', userDetails => {
            resolve(Object.assign(userDetails, {
              rhizomeId: userId,
              rhizomeAuthToken: userAuthToken
            }));
          })
          .on('error', err => reject(err));

          url = `${Rhizome.url}/user/${userId}/${user.app}/token`;
          restler.put(url, {query: {token: Rhizome.authToken},
            data: {token: user.token, tokenSecret: user.tokenSecret}})
            .on('error', err => {
              throw err;
              // reject(err);
            });
        }
      })
      .on('error', err => reject(err));
  });
};

module.exports = {
  findOrCreateUser: _findOrCreateUser
};
