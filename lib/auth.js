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
const _findOrCreateUser = (user, auth) => {
  return new Promise((resolve, reject) => {
    let url = `${Rhizome.url}/user/${user.app}/${user.id}`;
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
          let userId = data.id;
          let userAuthToken = data.authToken;
          url = `${Rhizome.url}/user/${userId}`;
          restler.get(url, {query: {token: Rhizome.authToken}})
          .on('success', userDetails => {
            if (userAuthToken || !auth) {
              resolve(Object.assign(userDetails, {
                rhizomeId: userId,
                rhizomeAuthToken: userAuthToken
              }));
            } else {
              url = `${Rhizome.url}/user/${userId}/token`;
              restler.put(url, {query: {token: Rhizome.authToken}, data: {auth: auth}})
                .on('success', token => {
                  resolve(Object.assign(userDetails, {
                    rhizomeId: userId,
                    rhizomeAuthToken: token.value
                  }));
                })
                .on('error', err => {
                  console.error(err);
                  reject(err);
                });
            }
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
