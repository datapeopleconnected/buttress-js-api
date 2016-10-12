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
    restler
      .get(url, {query: {token: _options.appToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _attachToPerson = (rhizomeUserId, person) => {
  return new Promise((resolve, reject) => {
    var url = `${_options.rhizomeUrl}/user/${rhizomeUserId}`;
    restler
      .put(url, {
        query: {
          token: _options.appToken
        },
        data: person
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

module.exports = {
  init: options => {
    _options = options;
  },
  load: _loadUser,
  attachToPerson: _attachToPerson
};
