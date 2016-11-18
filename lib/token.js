/**
 * Rhizome API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */
const restler = require('restler');
const Rhizome = require('./rhizome');

/**
 * @return {Promise} - resolves when completed
 */
function _rmAllUserTokens() {
  return new Promise((resolve, reject) => {
    var url = `${Rhizome.url}/token/user`;
    restler
      .del(url, {
        query: {
          token: Rhizome.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
}

module.exports = {
  removeAllUserTokens: _rmAllUserTokens,
  AuthLevel: {
    NONE: 0,
    USER: 1,
    ADMIN: 2,
    SUPER: 3
  }
};
