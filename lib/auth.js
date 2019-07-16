'use strict';

/**
 * Buttress API -
 *
 * @file auth.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');
const Helper = require('./helpers');

/**
 * @param {Object} user - user details
 * @param {Object} auth - auth details
 * @param {Object} options - request options
 * @return {Promise} - resolves to the serialized User object
 * @private
 */
const _findOrCreateUser = (user, auth, options) => {
  options = Helper.checkOptions(options);

  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/user/${user.app}/${user.id}`;

    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => {
        if (data === false) {
          url = `${Buttress.url}/user`;

          restler.postJson(url, {user: user, auth: auth}, {query: {token: Buttress.authToken}})
            .on('success', user => {
              resolve(user);
            })
            .on('error', err => {
              reject(err);
            });
        } else {
          resolve(data);
        }
      })
      .on('error', err => reject(err));
  });
};

/**
 * @param {Object} userId - user details
 * @param {Object} appAuth - app auth details
 * @return {Promise} - resolves to the serialized User object
 * @private
 */
const _addAuthToUser = (userId, appAuth) => {
  return new Promise((resolve, reject) => {
    let url = `${Buttress.url}/user/${userId}/auth`;

    restler.put(url, {query: {token: Buttress.authToken}, data: {auth: appAuth}})
      .on('success', user => {
        resolve(Object.assign(user, {
          buttressId: userId,
          buttressAuthToken: user.authToken
        }));
      })
      .on('error', err => {
        console.error(err);
        reject(err);
      });
  });
};

module.exports = {
  findOrCreateUser: _findOrCreateUser,
  addAuthToUser: _addAuthToUser
};
