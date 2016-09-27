/**
 * Rhizome API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
var _options = null;

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

module.exports = {
  init: options => {
    _options = options;
  },
  load: _loadUser
};
