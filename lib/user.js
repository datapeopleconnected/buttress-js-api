/**
 * Buttress API -
 *
 * @file user.js
 * @description
 * @author Chris Bates-Keegan
 *
 */

const restler = require('restler');
const Buttress = require('./buttressjs');

var _getAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user`;
    restler.get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _rmAll = () => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _loadUser = buttressUserId => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}`;
    restler
      .get(url, {query: {token: Buttress.authToken}})
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _attachToPerson = (buttressUserId, person) => {
  return new Promise((resolve, reject) => {
    var url = `${Buttress.url}/user/${buttressUserId}`;
    restler
      .put(url, {
        query: {
          token: Buttress.authToken
        },
        data: person
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

var _removeUser = buttressUserId => {
  return new Promise((resolve, reject) => {
    // var url = `${Buttress.url}/person/1`;
    var url = `${Buttress.url}/user/${buttressUserId}`;
    restler
      .del(url, {
        query: {
          token: Buttress.authToken
        }
      })
      .on('success', data => resolve(data))
      .on('fail', err => reject(new Error(err.message)))
      .on('error', err => reject(err));
  });
};

module.exports = {
  getAll: _getAll,
  removeAll: _rmAll,
  remove: _removeUser,
  load: _loadUser,
  attachToPerson: _attachToPerson
};
