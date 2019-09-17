"use strict";

/**
 * Buttress API -
 *
 * @file token.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const restler = require('restler');
const Buttress = require('./buttressjs');
const Helpers = require('./helpers');

/**
 * @return {Promise} - resolves when completed
 */
function _rmAllUserTokens(options) {
  options = Helpers.checkOptions(options, Buttress.authToken);

  return new Promise((resolve, reject) => {
    let url = `${Buttress.coreURL}/token/user`;
    restler
      .del(url, options)
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
}

const _updateRole = details => {
  return new Promise((resolve, reject) => {
    let json = JSON.stringify(details);
    let url = `${Buttress.coreURL}/token/roles`;
    restler
      .put(url, {
        query: {
          token: Buttress.authToken
        },
        headers: {'Content-Type': 'application/json', 'Content-Length': json.length},
        data: json
      })
      .on('success', data => resolve(data))
      .on('fail', (data, response) => {
        reject({
          statusCode: response.statusCode,
          statusMessage: response.statusMessage,
          message: data.message
        });
      })
      .on('error', err => reject(err));
  });
};

module.exports = {
  removeAllUserTokens: _rmAllUserTokens,
  updateRole: _updateRole,
  AuthLevel: {
    NONE: 0,
    USER: 1,
    ADMIN: 2,
    SUPER: 3
  }
};
